import {
    AudioPipelineInputs,
    AutomaticSpeechRecognitionConfig as ASRConfig,
    ProgressInfo,
    RawAudio,
    TextStreamer,
    pipeline,
    TextToAudioPipeline,
    TextToAudioOutput,
} from "@huggingface/transformers";

import { TextSplitterStream } from "kokoro-js";

import { SpeechToText } from "@/onnx/speech-to-text";
import { TextGeneration } from "@/onnx/text-generation";
import {
    KokoroTextToSpeech,
    PiperTextToSpeech,
    TextToSpeech,
} from "@/onnx/text-to-speech";

import type { ModelType } from "@/onnx/configs";
import { cleanTextForTTS } from "@/onnx/piper-tts/utils/text-cleaner";

export interface InitMessage {
    type: "INIT";
    modelType: ModelType;
    data?: ProgressInfo;
}

export interface InferenceMessage {
    type: "INFERENCE";
    modelType: ModelType;
    status: "inferencing" | "streaming" | "ready" | "error";
    data: unknown;
}

export interface DisposeMessage {
    type: "DISPOSE";
    modelType: ModelType;
    status?: "disposed";
    data?: unknown;
}

export interface TestMessage {
    type: "TEST";
    status?: "streaming" | "ready" | "error";
    data?: unknown;
}

export type Message =
    | InitMessage
    | InferenceMessage
    | DisposeMessage
    | TestMessage;

self.onmessage = async (event) => {
    const payload = event.data as Message;
    switch (payload.type) {
        case "INIT":
            await initModel(payload.modelType);
            break;

        case "INFERENCE":
            switch (payload.modelType) {
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
            }
            break;

        case "DISPOSE":
            await dispose(payload.modelType);
            break;
    }
};

const postMessage = (messages: Message, options?: WindowPostMessageOptions) => {
    self.postMessage(messages, options);
};

const initModel = async (modelType: ModelType) => {
    switch (modelType) {
        case "STT": {
            const stt = await SpeechToText.getInstance();
            stt.setProgressCallback((info) => {
                postMessage({
                    type: "INIT",
                    modelType: "STT",
                    data: info,
                });
            });
            await stt.getTranscriber();
            break;
        }

        case "TG": {
            const tg = await TextGeneration.getInstance();
            tg.setProgressCallback((info) => {
                postMessage({
                    type: "INIT",
                    modelType: "TG",
                    data: info,
                });
            });
            await tg.getGenerator();
            break;
        }

        case "TTS": {
            const tts = await TextToSpeech.getInstance();
            tts.setProgressCallback((info) => {
                postMessage({
                    type: "INIT",
                    modelType: "TTS",
                    data: info,
                });
            });
            await tts.getSpeaker();
            break;
        }

        case "STS": {
            await initModel("STT");
            await initModel("TG");
            await initModel("TTS");
            postMessage({
                type: "INIT",
                modelType: "STS",
                data: {
                    status: "ready",
                    task: "init",
                    model: "STS",
                },
            });
            break;
        }
    }
};

const speechToText = async (
    audioInput: AudioPipelineInputs,
    options?: Partial<ASRConfig>
) => {
    try {
        postMessage({
            type: "INFERENCE",
            modelType: "STT",
            status: "inferencing",
            data: "",
        });

        const stt = await SpeechToText.getInstance();
        const transcriber = await stt.getTranscriber();
        if (transcriber) {
            const ASROutput = await transcriber(audioInput, { ...options });
            let ASROutputText = "";
            if ("text" in ASROutput) {
                ASROutputText = ASROutput.text;
            } else {
                ASROutput.forEach(({ text }) => {
                    ASROutputText += text;
                });
            }
            postMessage({
                type: "INFERENCE",
                modelType: "STT",
                status: "ready",
                data: ASROutputText,
            });

            return Promise.resolve(ASROutputText);
        } else {
            postMessage({
                type: "INFERENCE",
                modelType: "STT",
                status: "error",
                data: "STT model not ready",
            });

            return Promise.reject("STT model not ready");
        }
    } catch (error) {
        postMessage({
            type: "INFERENCE",
            modelType: "STT",
            status: "error",
            data: error,
        });

        return Promise.reject(error);
    }
};

const textGenerator = async (
    prompt: string,
    textSplitter?: TextSplitterStream
) => {
    try {
        postMessage({
            type: "INFERENCE",
            modelType: "TG",
            status: "inferencing",
            data: "",
        });

        const tg = await TextGeneration.getInstance();
        const generator = await tg.getGenerator();
        if (generator) {
            let generatedText = "";
            const messages = [
                {
                    role: "system",
                    content:
                        "You are a helpful assistant. Do not use special characters. Do not use * character.",
                },
                { role: "user", content: prompt },
            ];
            const streamer = new TextStreamer(generator.tokenizer, {
                skip_prompt: true,
                skip_special_tokens: true,
                callback_function: (text) => {
                    generatedText += text;
                    if (textSplitter instanceof TextSplitterStream) {
                        textSplitter.push(text);
                    }
                    postMessage({
                        type: "INFERENCE",
                        modelType: "TG",
                        status: "streaming",
                        data: text,
                    });
                },
            });

            await generator(messages, {
                max_new_tokens: 1024,
                do_sample: false,
                add_special_tokens: false,
                streamer,
            });

            if (textSplitter instanceof TextSplitterStream) {
                textSplitter.close();
            }

            postMessage({
                type: "INFERENCE",
                modelType: "TG",
                status: "ready",
                data: generatedText,
            });

            return Promise.resolve(generatedText);
        } else {
            postMessage({
                type: "INFERENCE",
                modelType: "TG",
                status: "error",
                data: "TG model not ready",
            });

            return Promise.reject("TG model not ready");
        }
    } catch (error) {
        postMessage({
            type: "INFERENCE",
            modelType: "TG",
            status: "error",
            data: error,
        });

        return Promise.reject(error);
    }
};

const kokoroTextToSpeech = async (text: string | TextSplitterStream) => {
    try {
        postMessage({
            type: "INFERENCE",
            modelType: "TTS",
            status: "inferencing",
            data: "",
        });

        const kokoroTTS = await KokoroTextToSpeech.getInstance();
        const speaker = await kokoroTTS.getSpeaker();
        if (speaker) {
            let splitter: null | TextSplitterStream;
            if (text instanceof TextSplitterStream) {
                splitter = text;
            } else {
                splitter = new TextSplitterStream();
                splitter.push(text);
                splitter.close();
            }

            let i = 0;
            let audio: null | RawAudio;
            for await ({ audio } of speaker.stream(splitter, {
                voice: "af_heart",
            })) {
                const audioBuffer = audio.toWav();
                postMessage(
                    {
                        type: "INFERENCE",
                        modelType: "TTS",
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

            splitter = null;

            postMessage({
                type: "INFERENCE",
                modelType: "TTS",
                status: "ready",
                data: "TTS completed",
            });

            return Promise.resolve("TTS completed");
        } else {
            postMessage({
                type: "INFERENCE",
                modelType: "TTS",
                status: "error",
                data: "TTS model not ready",
            });

            return Promise.reject("TTS model not ready");
        }
    } catch (error) {
        postMessage({
            type: "INFERENCE",
            modelType: "TTS",
            status: "error",
            data: error,
        });

        return Promise.reject(error);
    }
};

const piperTextToSpeech = async (text: string | TextSplitterStream) => {
    try {
        postMessage({
            type: "INFERENCE",
            modelType: "TTS",
            status: "inferencing",
            data: "",
        });

        const piperTTS = PiperTextToSpeech.getInstance();
        const speaker = await piperTTS.getSpeaker();
        if (speaker) {
            let splitter: null | TextSplitterStream;
            if (text instanceof TextSplitterStream) {
                splitter = text;
            } else {
                splitter = new TextSplitterStream();
                splitter.push(text);
                splitter.close();
            }

            let i = 0;
            for await (const { audio } of speaker.stream(splitter, {
                speakerId: 175,
                noiseScale: 0,
                noiseWScale: 0,
            })) {
                const audioBuffer = audio.toWav();
                postMessage(
                    {
                        type: "INFERENCE",
                        modelType: "TTS",
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
                i++;
            }

            splitter = null;

            postMessage({
                type: "INFERENCE",
                modelType: "TTS",
                status: "ready",
                data: "TTS completed",
            });

            return Promise.resolve("TTS completed");
        } else {
            postMessage({
                type: "INFERENCE",
                modelType: "TTS",
                status: "error",
                data: "TTS model not ready",
            });

            return Promise.reject("TTS model not ready");
        }
    } catch (error) {
        postMessage({
            type: "INFERENCE",
            modelType: "TTS",
            status: "error",
            data: error,
        });

        return Promise.reject(error);
    }
};

const textToSpeech = async (text: string | TextSplitterStream) => {
    try {
        postMessage({
            type: "INFERENCE",
            modelType: "TTS",
            status: "inferencing",
            data: "",
        });

        const tts = await TextToSpeech.getInstance();
        const speaker = await tts.getSpeaker();
        if (speaker) {
            let splitter: null | TextSplitterStream;
            if (text instanceof TextSplitterStream) {
                splitter = text;
            } else {
                splitter = new TextSplitterStream();
                splitter.push(text);
                splitter.close();
            }

            let i = 0;
            for await (const sentence of splitter) {
                const clearedSentence = cleanTextForTTS(sentence);

                const audio = (await speaker(clearedSentence, {
                    speaker_embeddings:
                        "https://huggingface.co/onnx-community/Supertonic-TTS-ONNX/resolve/main/voices/F1.bin",
                    num_inference_steps: 16,
                })) as RawAudio;
                const audioBuffer = audio.toWav();
                postMessage(
                    {
                        type: "INFERENCE",
                        modelType: "TTS",
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
                i++;
            }

            splitter = null;
            postMessage({
                type: "INFERENCE",
                modelType: "TTS",
                status: "ready",
                data: "TTS completed",
            });

            return Promise.resolve("TTS completed");
        } else {
            postMessage({
                type: "INFERENCE",
                modelType: "TTS",
                status: "error",
                data: "TTS model not ready",
            });

            return Promise.reject("TTS model not ready");
        }
    } catch (error) {
        postMessage({
            type: "INFERENCE",
            modelType: "TTS",
            status: "error",
            data: error,
        });

        return Promise.reject(error);
    }
};

const speechToSpeech = async (audioInput: AudioPipelineInputs) => {
    try {
        const prompt = await speechToText(audioInput, { language: "en" });

        let textSplitter: null | TextSplitterStream = new TextSplitterStream();
        await textGenerator(prompt, textSplitter);

        await textToSpeech(textSplitter);
        textSplitter = null;

        postMessage({
            type: "INFERENCE",
            modelType: "STS",
            status: "ready",
            data: "STS completed",
        });

        return Promise.resolve("STS completed");
    } catch (error) {
        postMessage({
            type: "INFERENCE",
            modelType: "STS",
            status: "error",
            data: error,
        });

        return Promise.reject(error);
    }
};

const dispose = async (modelType: ModelType) => {
    switch (modelType) {
        case "STT": {
            const stt = await SpeechToText.getInstance();
            await stt.dispose();
            break;
        }

        case "TG": {
            const tg = await TextGeneration.getInstance();
            await tg.dispose();
            break;
        }

        case "TTS": {
            const tts = await TextToSpeech.getInstance();
            await tts.dispose();
            break;
        }

        case "STS": {
            await dispose("STT");
            await dispose("TG");
            await dispose("TTS");
            break;
        }
    }

    postMessage({
        type: "DISPOSE",
        modelType: modelType,
        status: "disposed",
    });
};
