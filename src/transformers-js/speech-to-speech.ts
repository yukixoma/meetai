import {
    AutomaticSpeechRecognitionPipeline as ASRPipeline,
    pipeline,
    TextGenerationPipeline,
    ProgressInfo,
} from "@huggingface/transformers";

import { KokoroTTS } from "kokoro-js";

import type { ModelSettings, ModelType } from "./configs";

import {
    LOCAL_AI_STT_MODEL_ID,
    LOCAL_AI_STT_SETTINGS,
    LOCAL_AI_TEXT_GENERATOR_MODEL_ID,
    LOCAL_AI_TEXT_GENERATOR_SETTINGS,
    LOCAL_AI_TTS_MODEL_ID,
    LOCAL_AI_TTS_SETTINGS,
} from "./configs";

/**
 * Speech to speech main class
 * Singleton class to avoid multiple creating which will lead to memory leak
 */
export class SpeechToSpeech {
    private static instance: null | SpeechToSpeech;
    private isWebGPUSupport = false;

    /** Speech to text */
    private speechToTextGenerator: ASRPipeline | null = null;
    private speechToTextModelLoadingStatus: ProgressInfo | null = null;
    private speechToTextModel: string = LOCAL_AI_STT_MODEL_ID;
    private speechToTextModelSettings: ModelSettings = LOCAL_AI_STT_SETTINGS;

    /** Text generator */
    private textGenerator: TextGenerationPipeline | null = null;
    private textGeneratorModelLoadingStatus: ProgressInfo | null = null;
    private textGeneratorModel: string = LOCAL_AI_TEXT_GENERATOR_MODEL_ID;
    private textGeneratorModelSettings: ModelSettings =
        LOCAL_AI_TEXT_GENERATOR_SETTINGS;

    /** Text to speech */
    private textToSpeechGenerator: KokoroTTS | null = null;
    // private textToSpeechGenerator: TextToAudioPipeline | null = null;
    private textToSpeechModelLoadingStatus: ProgressInfo | null = null;
    private textToSpeechModel: string = LOCAL_AI_TTS_MODEL_ID;
    private textToSpeechModelSettings: ModelSettings = LOCAL_AI_TTS_SETTINGS;

    private constructor() {}

    /** Satisfy "no constructor return" singleton pattern */
    public static getInstance = async () => {
        if (!this.instance) {
            this.instance = new SpeechToSpeech();
        }
        this.instance.isWebGPUSupport = await this.checkWebGPUSupport();

        return this.instance;
    };

    /** Check for webgpu support */
    public static checkWebGPUSupport = async () => {
        if (!navigator.gpu) {
            return false;
        }

        const gpuAdapter = await navigator.gpu.requestAdapter();
        return !!gpuAdapter;
    };

    /** Progress callback */
    public setProgressCallback = (
        functionId: ModelType,
        progressCallback: ModelSettings["progress_callback"]
    ) => {
        switch (functionId) {
            case "STT":
                this.speechToTextModelSettings.progress_callback =
                    progressCallback;
                break;

            case "TG":
                this.textGeneratorModelSettings.progress_callback =
                    progressCallback;
                break;

            case "TTS":
                this.textToSpeechModelSettings.progress_callback =
                    progressCallback;
                break;

            case "STS":
                this.speechToTextModelSettings.progress_callback =
                    progressCallback;

                this.textGeneratorModelSettings.progress_callback =
                    progressCallback;

                this.textToSpeechModelSettings.progress_callback =
                    progressCallback;
                break;
        }
    };

    /** Dispose model */
    public disposeModel = async (modelType: ModelType) => {
        switch (modelType) {
            case "STT":
                if (this.speechToTextGenerator instanceof ASRPipeline) {
                    await this.speechToTextGenerator.dispose();
                }
                this.speechToTextGenerator = null;
                break;

            case "TG":
                if (this.textGenerator instanceof TextGenerationPipeline) {
                    await this.textGenerator.dispose();
                }
                this.textGenerator = null;
                break;

            case "TTS":
                if (this.textToSpeechGenerator instanceof KokoroTTS) {
                    await this.textToSpeechGenerator.model.dispose();
                }
                this.textToSpeechGenerator = null;
                break;

            case "STS":
                await this.disposeModel("STT");
                await this.disposeModel("TG");
                await this.disposeModel("TTS");
                SpeechToSpeech.instance = null;
                break;
        }
    };

    /** Speech to text */
    public setSpeechToTextGenerator = async () => {
        await this.disposeModel("STT");

        if (
            this.speechToTextModelSettings.device === "webgpu" &&
            !this.isWebGPUSupport
        ) {
            this.speechToTextModelSettings.device = "wasm";
        }

        this.speechToTextGenerator = await pipeline(
            "automatic-speech-recognition",
            this.speechToTextModel,
            {
                ...this.speechToTextModelSettings,
                progress_callback: (info) => {
                    this.speechToTextModelLoadingStatus = info;
                    this.speechToTextModelSettings.progress_callback?.(info);
                },
            }
        );
    };

    public getSpeechToTextGenerator = async () => {
        if (!this.speechToTextGenerator) {
            await this.setSpeechToTextGenerator();
        }

        return this.speechToTextGenerator;
    };

    public setSpeechToTextModelLoadingStatus = (info: ProgressInfo) => {
        this.speechToTextModelLoadingStatus = info;
    };

    public getSpeechToTextModelLoadingStatus = () => {
        return this.speechToTextModelLoadingStatus;
    };

    public setSpeechToTextModel = async (model: string) => {
        this.speechToTextModel = model;
        this.speechToTextGenerator = null;
    };

    public getSpeechToTextModel = () => {
        return this.speechToTextModel;
    };

    public setSpeechToTextModelSettings = async (settings: ModelSettings) => {
        this.speechToTextModelSettings = settings;
        this.speechToTextGenerator = null;
    };

    public getSpeechToTextModelSettings = () => {
        return this.speechToTextModelSettings;
    };

    /** Text generator */
    private setTextGenerator = async () => {
        await this.disposeModel("TG");

        if (
            this.textGeneratorModelSettings.device === "webgpu" &&
            !this.isWebGPUSupport
        ) {
            this.textGeneratorModelSettings.device = "wasm";
        }

        this.textGenerator = await pipeline(
            "text-generation",
            this.textGeneratorModel,
            {
                ...this.textGeneratorModelSettings,
                progress_callback: (info) => {
                    this.textGeneratorModelLoadingStatus = info;
                    this.textGeneratorModelSettings.progress_callback?.(info);
                },
            }
        );
    };

    public getTextGenerator = async () => {
        if (!this.textGenerator) {
            await this.setTextGenerator();
        }

        return this.textGenerator;
    };

    public setTextGeneratorModelLoadingStatus = (info: ProgressInfo) => {
        this.textGeneratorModelLoadingStatus = info;
    };

    public getTextGeneratorModelLoadingStatus = () => {
        return this.textGeneratorModelLoadingStatus;
    };

    public setTextGeneratorModel = async (model: string) => {
        this.textGeneratorModel = model;
        this.textGenerator = null;
    };

    public getTextGeneratorModel = () => {
        return this.textGeneratorModel;
    };

    public setTextGeneratorModelSettings = async (settings: ModelSettings) => {
        this.textGeneratorModelSettings = settings;
        this.textGenerator = null;
    };

    public getTextGeneratorModelSettings = () => {
        return this.textGeneratorModelSettings;
    };

    /** Text to speech */
    private setTextToSpeechGenerator = async () => {
        await this.disposeModel("TTS");

        if (
            this.textToSpeechModelSettings.device === "webgpu" &&
            !this.isWebGPUSupport
        ) {
            this.textToSpeechModelSettings.device = "wasm";
        }

        this.textToSpeechGenerator = await KokoroTTS.from_pretrained(
            this.textToSpeechModel,
            {
                ...this.textToSpeechModelSettings,
                progress_callback: (info) => {
                    this.textToSpeechModelLoadingStatus = info;
                    this.textToSpeechModelSettings.progress_callback?.(info);
                },
            }
        );
    };

    public getTextToSpeechGenerator = async () => {
        if (!this.textToSpeechGenerator) {
            await this.setTextToSpeechGenerator();
        }

        return this.textToSpeechGenerator;
    };

    public setTextToSpeechModelLoadingStatus = (info: ProgressInfo) => {
        this.textToSpeechModelLoadingStatus = info;
    };

    public getTextToSpeechModelLoadingStatus = () => {
        return this.textToSpeechModelLoadingStatus;
    };

    public setTextToSpeechModel = async (model: string) => {
        this.textToSpeechModel = model;
        this.textToSpeechGenerator = null;
    };

    public getTextToSpeechModel = () => {
        return this.textToSpeechModel;
    };

    public setTextToSpeechModelSettings = (settings: ModelSettings) => {
        this.textToSpeechModelSettings = settings;
        this.textToSpeechGenerator = null;
    };

    public getTextToSpeechModelSettings = () => {
        return this.textToSpeechModelSettings;
    };
}
