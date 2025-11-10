import {
    AudioPipelineInputs,
    AutomaticSpeechRecognitionConfig,
    ProgressInfo,
    RawAudio,
    TextStreamer,
} from "@huggingface/transformers";

import { TextSplitterStream } from "kokoro-js";

import type { ModelType } from "@/transformers-js/configs";

import { SpeechToSpeech } from "@/transformers-js/speech-to-speech";

export interface InitMessage {
    type: "INIT";
    status: ProgressInfo["status"];
    data: ModelType | ProgressInfo;
}

export interface InferenceMessage {
    type: "STT" | "TG" | "TTS" | "STS";
    status:
        | "initiate"
        | "inferencing"
        | "streaming"
        | "done"
        | "ready"
        | "error";
    data: unknown;
}

export interface DisposeMessage {
    type: "DISPOSE";
    status: "disposed";
    data?: unknown;
}

export type Message = InitMessage | InferenceMessage | DisposeMessage;

self.onmessage = async (event) => {
    const payload = event.data as Message;
    switch (payload.type) {
        case "INIT":
            await initModel(payload.data as ModelType);
            break;

        case "STT":
            await speechToText(payload.data as Float32Array);
            break;

        case "TG":
            await textGenerator(payload.data as string);
            break;

        case "TTS":
            await textToSpeech(payload.data as string);
            break;

        case "STS":
            await speechToSpeech(payload.data as Float32Array);
            break;

        case "DISPOSE":
            await dispose(payload.data as ModelType);
            break;
    }
};

const postMessage = (messages: Message, options?: WindowPostMessageOptions) => {
    self.postMessage(messages, options);
};

const initModel = async (modelType: ModelType) => {
    const sts = await SpeechToSpeech.getInstance();
    sts.setProgressCallback(modelType, (info) => {
        postMessage({
            type: "INIT",
            status: info.status,
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
            postMessage({
                type: "INIT",
                status: "ready",
                data: { model: "STS", status: "ready", task: "model init" },
            });
            break;
    }
};

const speechToText = async (
    audioInput: AudioPipelineInputs,
    options?: Partial<AutomaticSpeechRecognitionConfig>
) => {
    const STS = await SpeechToSpeech.getInstance();
    const STT = await STS.getSpeechToTextGenerator();

    if (STT) {
        const text = await STT(audioInput, options);
        postMessage({
            type: "STT",
            status: "ready",
            data: JSON.stringify(text),
        });

        return JSON.stringify(text);
    }

    if (STS.getSpeechToTextModelLoadingStatus()?.status !== "ready") {
        postMessage({
            type: "STT",
            status: "error",
            data: "STT model not ready",
        });

        return Promise.reject("STT model not ready");
    }

    postMessage({
        type: "STT",
        status: "error",
        data: "STT model error",
    });

    return Promise.reject("STT model error");
};

const textGenerator = async (prompt: string) => {
    const STS = await SpeechToSpeech.getInstance();
    const TG = await STS.getTextGenerator();

    if (TG) {
        let generatedText = "";
        const messages = [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt },
        ];

        const streamer = new TextStreamer(TG.tokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: (text) => {
                generatedText += text;
                postMessage({
                    type: "TG",
                    status: "streaming",
                    data: text,
                });
            },
        });

        await TG(messages, {
            max_new_tokens: 1024,
            do_sample: false,
            add_special_tokens: false,
            streamer,
        });

        postMessage({
            type: "TG",
            status: "done",
            data: "",
        });

        postMessage({
            type: "TG",
            status: "ready",
            data: "",
        });

        return generatedText;
    }

    if (STS.getTextGeneratorModelLoadingStatus()?.status !== "ready") {
        postMessage({
            type: "TG",
            status: "error",
            data: "TG model not ready",
        });

        return Promise.reject("TG model not ready");
    }

    postMessage({
        type: "TG",
        status: "error",
        data: "TG model error",
    });

    return Promise.reject("TG model error");
};

const textToSpeech = async (text: string) => {
    const STS = await SpeechToSpeech.getInstance();
    const TTS = await STS.getTextToSpeechGenerator();

    if (TTS) {
        /** Kokoro TTS can process only 510 tokens in a single pass,
         * so we use splitter to split long text input
         */
        const splitter = new TextSplitterStream();
        splitter.push(text);
        splitter.close();

        let i = 0;
        let audio: null | RawAudio;
        for await ({ audio } of TTS.stream(splitter)) {
            const audioBuffer = audio.toWav();
            postMessage(
                {
                    type: "TTS",
                    status: "streaming",
                    data: {
                        part: i,
                        data: audioBuffer,
                    },
                },
                {
                    /** Use transferable object for transfering data efficiently */
                    transfer: [audioBuffer],
                }
            );
            /** Workaround to avoid memory leak in AsyncIterator */
            audio = null;
            i++;
        }

        postMessage({
            type: "TTS",
            status: "done",
            data: "",
        });

        postMessage({
            type: "TTS",
            status: "ready",
            data: "",
        });

        return Promise.resolve(true);
    }

    if (STS.getTextToSpeechModelLoadingStatus()?.status !== "ready") {
        postMessage({
            type: "TTS",
            status: "error",
            data: "TG model not ready",
        });

        return Promise.reject("TTS model not ready");
    }

    postMessage({
        type: "TTS",
        status: "error",
        data: "TTS model error",
    });

    return Promise.reject("TTS model error");
};

const speechToSpeech = async (audioInput: AudioPipelineInputs) => {
    try {
        let STS = await SpeechToSpeech.getInstance();
        let STT = await STS.getSpeechToTextGenerator();
        let TG = await STS.getTextGenerator();
        let TTS = await STS.getTextToSpeechGenerator();

        if (!STT || !TG || !TTS) {
            postMessage({
                type: "STS",
                status: "error",
                data: "Model not ready",
            });
            throw new Error("Model not ready");
        }

        /** STT */
        const prompt = await STT(audioInput, { language: "en" });
        postMessage({
            type: "STT",
            status: "ready",
            data: JSON.stringify(prompt),
        });

        /** TG */
        let generatedText = "";
        const messages = [
            {
                role: "system",
                content:
                    "You are a helpful assistant. Do not use special character. Do not use * character",
            },
            { role: "user", content: JSON.stringify(prompt) },
        ];

        /** Kokoro TTS can process only 510 tokens in a single pass,
         * so we use splitter to split long text input
         */
        const splitter = new TextSplitterStream();
        const streamer = new TextStreamer(TG.tokenizer, {
            skip_prompt: true,
            skip_special_tokens: true,
            callback_function: (text) => {
                generatedText += text;
                splitter.push(text);
            },
        });

        await TG(messages, {
            max_new_tokens: 512,
            do_sample: false,
            add_special_tokens: false,
            streamer,
        });

        postMessage({
            type: "TG",
            status: "ready",
            data: generatedText,
        });

        /** STT */
        splitter.close();

        let i = 0;
        let audio: null | RawAudio;
        for await ({ audio } of TTS.stream(splitter)) {
            const audioBuffer = audio.toWav();
            postMessage(
                {
                    type: "TTS",
                    status: "streaming",
                    data: {
                        part: i,
                        data: audioBuffer,
                    },
                },
                {
                    /** Use transferable object for transfering data efficiently */
                    transfer: [audioBuffer],
                }
            );
            /** Workaround to avoid memory leak in AsyncIterator */
            audio = null;
            i++;
        }

        postMessage({
            type: "STS",
            status: "ready",
            data: "",
        });
    } catch (error) {
        console.log(error);
    }
};

const dispose = async (modelType: ModelType) => {
    const STS = await SpeechToSpeech.getInstance();
    await STS.disposeModel(modelType);
    postMessage({
        type: "DISPOSE",
        status: "disposed",
    });
};
