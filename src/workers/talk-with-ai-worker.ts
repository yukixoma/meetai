import {
    AudioPipelineInputs,
    ProgressInfo,
    TextStreamer,
} from "@huggingface/transformers";

import { TextSplitterStream } from "kokoro-js";

import type { ModelType } from "@/transformers-js/configs";

import { SpeechToSpeech } from "@/transformers-js/speech-to-speech";

export interface TalkWithAiMessage {
    type: "INIT" | "STT" | "TTT" | "TTS" | "STS";
    status:
        | "init"
        | "start"
        | "loading"
        | "listening"
        | "inferencing"
        | "speaking"
        | "ended"
        | "ready";
    data: unknown;
}

self.onmessage = (event) => {
    const payload = event.data as TalkWithAiMessage;
    switch (payload.type) {
        case "INIT":
            initModel(payload.data as ModelType);
            break;
        case "STT":
            speechToText(payload.data as Float32Array);
            break;

        case "TTT":
            textGeneration(payload.data as string);
            break;

        case "TTS":
            textToSpeech(payload.data as string);
            break;

        case "STS":
            speechToSpeech(payload.data as Float32Array);
            break;
    }
};

const sendMessage = (messages: TalkWithAiMessage) => {
    self.postMessage(messages);
};

const initModel = async (modelType: ModelType) => {
    const sts = new SpeechToSpeech();
    sts.setProgressCallback(modelType, (info) => {
        sendMessage({
            type: "INIT",
            data: info,
        });
    });
    switch (modelType) {
        case "STT":
            await sts.getSpeechToTextGenerator();
            break;

        case "TG":
            await sts.getTextGenerator();
            break;

        case "TTS":
            await sts.getTextToSpeechGenerator();
            break;

        case "STS":
            await sts.getSpeechToTextGenerator();
            await sts.getTextGenerator();
            await sts.getTextToSpeechGenerator();
            sendMessage({
                type: "INIT",
                status: "ready",
                data: { status: "ready", model: "STT" },
            });
            break;
    }
};

const speechToText = async (audioInput: AudioPipelineInputs) => {
    const STS = new SpeechToSpeech();
    const STT = await STS.getSpeechToTextGenerator();

    if (STT) {
        const text = await STT(audioInput, { task: "transcribe" });
        sendMessage({
            type: "STT",
            status: "ended",
            data: JSON.stringify(text),
        });
    }
};

const textGeneration = async (prompt: string) => {
    const STS = new SpeechToSpeech();
    const TG = await STS.getTextGenerator();

    if (TG) {
        const messages = [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
        ];

        const output = await TG(messages, {
            max_new_tokens: 1024,
            do_sample: false,
            add_special_tokens: false,
        });

        sendMessage({
            type: "TTT",
            status: "ended",
            data: output[0]["generated_text"][2]["content"],
        });
    }
};

const textToSpeech = async (text: string) => {
    const STS = new SpeechToSpeech();
    const TTS = await STS.getTextToSpeechGenerator();

    if (TTS) {
        const splitter = new TextSplitterStream();
        splitter.push(text);
        splitter.close();

        const stream = TTS.stream(splitter);

        let i = 0;
        for await (const { audio } of stream) {
            const status = i === 0 ? "start" : "speaking";
            sendMessage({
                type: "TTS",
                status,
                data: audio.toBlob(),
            });
            i++;
        }

        sendMessage({
            type: "TTS",
            status: "ended",
            data: "",
        });
    }
};

const speechToSpeech = async (audioInput: AudioPipelineInputs) => {
    const STS = new SpeechToSpeech();

    STS.setProgressCallback("STT", (info) => {
        STS.setSpeechToTextModelLoadingStatus(info);
        console.log("STT loading status:", info);
    });

    const STT = await STS.getSpeechToTextGenerator();
    const TG = await STS.getTextGenerator();
    const TTS = await STS.getTextToSpeechGenerator();

    if (!STT || !TG || !TTS) return;

    const prompt = await STT(audioInput, { language: "en" });
    console.log(prompt);

    const messages = [
        {
            role: "system",
            content:
                "You are a helpful assistant. Do not use special character.",
        },
        { role: "user", content: JSON.stringify(prompt) },
    ];

    /** Prepare for TTS */
    const splitter = new TextSplitterStream();

    /** Use stream for pushing text generated from TG to text splitter */
    const streamer = new TextStreamer(TG.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text) => {
            splitter.push(text);
        },
    });

    const output = await TG(messages, {
        max_new_tokens: 1024,
        do_sample: false,
        add_special_tokens: false,
        streamer,
    });
    console.log(output[0]["generated_text"][2]["content"]);

    /** No more token will be generated */
    splitter.close();

    const stream = TTS.stream(splitter);

    let i = 0;
    for await (const { audio } of stream) {
        const status = i === 0 ? "start" : "speaking";
        sendMessage({
            type: "STS",
            status,
            data: audio.toBlob(),
        });
        i++;
    }

    sendMessage({
        type: "STS",
        status: "ended",
        data: "",
    });
};
