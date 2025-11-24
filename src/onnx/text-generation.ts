import { pipeline, TextGenerationPipeline } from "@huggingface/transformers";

import {
    TEXT_GENERATOR_MODEL_ID as DEFAULT_MODEL_ID,
    TEXT_GENERATOR_CONFIGS as DEFAULT_CONFIGS,
} from "@/onnx/configs";

import { checkWebGPUSupport } from "@/onnx/utils";

import type { ProgressInfo } from "@huggingface/transformers";
import type { ModelConfigs } from "@/onnx/configs";

export class TextGeneration {
    private static instance: null | TextGeneration = null;
    private isWebGPUSupport = false;
    private textGenerator: null | TextGenerationPipeline = null;
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
        if (TextGeneration.instance === null) {
            TextGeneration.instance = new TextGeneration(modelID, configs);
        }
        TextGeneration.instance.isWebGPUSupport = await checkWebGPUSupport();

        return TextGeneration.instance;
    }

    private async setGenerator() {
        await this.disposeModel();

        if (this.configs.device === "webgpu" && !this.isWebGPUSupport) {
            this.configs = {
                ...this.configs,
                device: "wasm",
            };
        }

        // @ts-ignore
        this.textGenerator = await pipeline("text-generation", this.modelID, {
            ...this.configs,
            // @ts-ignore
            progress_callback: (info) => {
                this.status = info;
                this.configs.progress_callback?.(info);
            },
        });
    }

    public async getGenerator() {
        if (!(this.textGenerator instanceof TextGenerationPipeline)) {
            await this.setGenerator();
        }

        return this.textGenerator;
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
        await this.textGenerator?.dispose();
        this.textGenerator = null;
        this.status = null;
    }

    public async dispose() {
        await this.disposeModel();
        TextGeneration.instance = null;
    }
}
