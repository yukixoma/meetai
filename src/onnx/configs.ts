import { env, ProgressInfo } from "@huggingface/transformers";

if (env.backends.onnx.wasm) {
    env.backends.onnx.wasm.wasmPaths =
        "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/";
    env.backends.onnx.wasm.numThreads = 0;
    env.backends.onnx.logLevel = "error";
}

env.allowLocalModels = true;
env.localModelPath = "http://localhost:3001/models/";

export type ModelType = "VAD" | "STT" | "TG" | "TTS" | "STS";

export interface ModelConfigs {
    dtype?: "fp32" | "fp16" | "q4" | "q4f16";
    device?: "webgpu" | "wasm";
    use_external_data_format?: boolean;
    progress_callback?: (progressInfo: ProgressInfo) => void;
}

/**
 * Default configs for speech to text model
 */
export const STT_MODEL_ID = "onnx-community/whisper-base";
export const STT_CONFIGS: ModelConfigs = {
    dtype: "fp32",
    device: "webgpu",
};

/**
 * Default configs for text generation model
 */
export const TEXT_GENERATOR_MODEL_ID = "onnx-community/LFM2-1.2B-ONNX";
export const TEXT_GENERATOR_CONFIGS: ModelConfigs = {
    dtype: "q4",
    device: "webgpu",
};

/**
 * Default configs for text to speech model
 */
export const TTS_KOKORO_MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
export const TTS_MODEL_ID = "onnx-community/Supertonic-TTS-ONNX";
export const TTS_CONFIGS: ModelConfigs = {
    /** Kokoro (WebGPU) only work with fp32 dtype */
    dtype: "fp32",
    /** Using Kokoro with WebGPU will cause memory leak, but wasm is too slow */
    device: "webgpu",
};
export const PIPER_TTS_MODEL_PATH =
    "http://localhost:3001/models/piper-tts/en_US-libritts_r-medium.onnx";
export const PIPER_TTS_CONFIG_PATH =
    "http://localhost:3001/models/piper-tts/en_US-libritts_r-medium.onnx.json";
