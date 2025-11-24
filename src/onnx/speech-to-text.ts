import {
    AutomaticSpeechRecognitionPipeline as ASRPipeline,
    pipeline,
} from "@huggingface/transformers";

import {
    STT_MODEL_ID as DEFAULT_MODEL_ID,
    STT_CONFIGS as DEFAULT_CONFIGS,
} from "@/onnx/configs";

import type { ProgressInfo } from "@huggingface/transformers";
import type { ModelConfigs } from "@/onnx/configs";

import { checkWebGPUSupport } from "@/onnx/utils";

/**
 * Speech to text sigleton class
 */
export class SpeechToText {
    private static instance: null | SpeechToText = null;
    private isWebGPUSupport = false;
    private transcriber: null | ASRPipeline = null;
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
        if (SpeechToText.instance === null) {
            SpeechToText.instance = new SpeechToText(modelID, configs);
        } else {
            await SpeechToText.instance.setModelID(modelID);
            await SpeechToText.instance.setConfigs(configs);
        }
        SpeechToText.instance.isWebGPUSupport = await checkWebGPUSupport();

        return SpeechToText.instance;
    }

    private async setTranscriber() {
        await this.disposeModel();

        if (this.configs.device === "webgpu" && !this.isWebGPUSupport) {
            this.configs = {
                ...this.configs,
                device: "wasm",
            };
        }
        // @ts-ignore
        this.transcriber = await pipeline(
            "automatic-speech-recognition",
            this.modelID,
            {
                ...this.configs,
                // @ts-ignore
                progress_callback: (info) => {
                    this.status = info;
                    this.configs.progress_callback?.(info);
                },
            }
        );
    }

    public async getTranscriber() {
        if (!(this.transcriber instanceof ASRPipeline)) {
            await this.setTranscriber();
        }

        return this.transcriber;
    }

    public async setModelID(modelID: string = this.modelID) {
        await this.disposeModel();
        this.modelID = modelID;
    }

    public getModelID() {
        return this.modelID;
    }

    public async setConfigs(configs: ModelConfigs = this.configs) {
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
        await this.transcriber?.dispose();
        this.transcriber = null;
        this.status = null;
    }

    public async dispose() {
        await this.disposeModel();
        SpeechToText.instance = null;
    }
}
