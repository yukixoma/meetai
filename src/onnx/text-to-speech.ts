import { KokoroTTS } from "kokoro-js";

import {
    TTS_KOKORO_MODEL_ID as DEFAULT_MODEL_ID,
    TTS_MODEL_ID,
    TTS_CONFIGS as DEFAULT_CONFIGS,
    PIPER_TTS_MODEL_PATH,
    PIPER_TTS_CONFIG_PATH,
} from "@/onnx/configs";

import { checkWebGPUSupport } from "@/onnx/utils";

import {
    pipeline,
    TextToAudioPipeline,
    type ProgressInfo,
} from "@huggingface/transformers";
import type { ModelConfigs } from "@/onnx/configs";
import { PiperTTS } from "./piper-tts/libs/piper-tts";

export class KokoroTextToSpeech {
    private static instance: null | KokoroTextToSpeech = null;
    private isWebGPUSupport = false;
    private speaker: null | KokoroTTS = null;
    private status: null | ProgressInfo = null;
    private modelID = DEFAULT_MODEL_ID;
    private configs = DEFAULT_CONFIGS;

    private constructor(modelID = DEFAULT_MODEL_ID, configs = DEFAULT_CONFIGS) {
        this.modelID = modelID;
        this.configs = configs;
    }

    public static async getInstance(
        modelID = DEFAULT_MODEL_ID,
        configs = DEFAULT_CONFIGS
    ) {
        if (KokoroTextToSpeech.instance === null) {
            KokoroTextToSpeech.instance = new KokoroTextToSpeech(
                modelID,
                configs
            );
        }
        KokoroTextToSpeech.instance.isWebGPUSupport =
            await checkWebGPUSupport();

        return KokoroTextToSpeech.instance;
    }

    private async setSpeaker() {
        await this.disposeModel();

        if (this.configs.device === "webgpu" && !this.isWebGPUSupport) {
            this.configs = {
                ...this.configs,
                device: "wasm",
            };
        }

        this.speaker = await KokoroTTS.from_pretrained(this.modelID, {
            ...this.configs,
            progress_callback: (info) => {
                this.status = info;
                this.configs.progress_callback?.(info);
            },
        });
    }

    public async getSpeaker() {
        if (!(this.speaker instanceof KokoroTTS)) {
            await this.setSpeaker();
        }

        return this.speaker;
    }

    public async setModelID(modelID: string) {
        await this.disposeModel();
        this.modelID = modelID;
    }

    public getModelID() {
        return this.modelID;
    }

    public async setConfigs(configs: ModelConfigs) {
        await this.disposeModel();
        this.configs = configs;
    }

    public getConfigs() {
        return this.configs;
    }

    public setProgressCallback(
        progressCallback: ModelConfigs["progress_callback"]
    ) {
        this.configs = {
            ...this.configs,
            progress_callback: progressCallback,
        };
    }

    public getStatus() {
        return this.status;
    }

    public async disposeModel() {
        await this.speaker?.model.dispose();
        this.speaker = null;
        this.status = null;
    }

    public async dispose() {
        await this.disposeModel();
        KokoroTextToSpeech.instance = null;
    }
}

export class PiperTextToSpeech {
    private static instance: null | PiperTextToSpeech = null;
    private modelPath: null | string = null;
    private configPath: null | string = null;
    private speaker: null | PiperTTS = null;

    private constructor(modelPath: string, configPath: string) {
        this.modelPath = modelPath;
        this.configPath = configPath;
    }

    public static getInstance(
        modelPath = PIPER_TTS_MODEL_PATH,
        configPath = PIPER_TTS_CONFIG_PATH
    ) {
        if (PiperTextToSpeech.instance === null) {
            PiperTextToSpeech.instance = new PiperTextToSpeech(
                modelPath,
                configPath
            );
        }
        return PiperTextToSpeech.instance;
    }

    public async setSpeaker() {
        await this.disposeModel();

        this.speaker = await PiperTTS.from_pretrained(
            this.modelPath,
            this.configPath
        );
    }

    public async getSpeaker() {
        if (this.speaker === null) {
            await this.setSpeaker();
        }

        return this.speaker;
    }

    public async disposeModel() {
        if (this.speaker && this.speaker.session) {
            await this.speaker.session.release();
        }

        this.speaker = null;
    }

    public async dispose() {
        await this.disposeModel();
        PiperTextToSpeech.instance = null;
    }
}

export class TextToSpeech {
    private static instance: null | TextToSpeech = null;
    private isWebGPUSupport = false;
    private speaker: null | TextToAudioPipeline = null;
    private status: null | ProgressInfo = null;
    private modelID = TTS_MODEL_ID;
    private configs = DEFAULT_CONFIGS;

    private constructor(modelID = TTS_MODEL_ID, configs = DEFAULT_CONFIGS) {
        this.modelID = modelID;
        this.configs = configs;
    }

    public static async getInstance(
        modelID = TTS_MODEL_ID,
        configs = DEFAULT_CONFIGS
    ) {
        if (TextToSpeech.instance === null) {
            TextToSpeech.instance = new TextToSpeech(modelID, configs);
        }
        TextToSpeech.instance.isWebGPUSupport = await checkWebGPUSupport();

        return TextToSpeech.instance;
    }

    private async setSpeaker() {
        await this.disposeModel();

        if (this.configs.device === "webgpu" && !this.isWebGPUSupport) {
            this.configs = {
                ...this.configs,
                device: "wasm",
            };
        }

        // @ts-ignore
        this.speaker = await pipeline("text-to-speech", this.modelID, {
            ...this.configs,
            // @ts-ignore
            progress_callback: (info) => {
                this.status = info;
                this.configs.progress_callback?.(info);
            },
        });
    }

    public async getSpeaker() {
        if (!(this.speaker instanceof TextToAudioPipeline)) {
            await this.setSpeaker();
        }

        return this.speaker;
    }

    public async setModelID(modelID: string = this.modelID) {
        await this.disposeModel();
        this.modelID = modelID;
    }

    public getModelID() {
        return this.modelID;
    }

    public async setConfigs(configs: ModelConfigs) {
        await this.disposeModel();
        this.configs = configs;
    }

    public getConfigs() {
        return this.configs;
    }

    public setProgressCallback(
        progressCallback: ModelConfigs["progress_callback"]
    ) {
        this.configs = {
            ...this.configs,
            progress_callback: progressCallback,
        };
    }

    public getStatus() {
        return this.status;
    }

    public async disposeModel() {
        await this.speaker?.dispose();
        this.speaker = null;
        this.status = null;
    }

    public async dispose() {
        await this.disposeModel();
        TextToSpeech.instance = null;
    }
}
