import { env, ProgressInfo } from "@huggingface/transformers";

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = "http://localhost:3001/models";

export interface ModelSettings {
    dtype?: "fp32" | "fp16" | "q4";
    device?: "wasm" | "webgpu";
    use_external_data_format?: boolean;
    progress_callback?: (progressInfo: ProgressInfo) => void;
}

export type ModelType = "STT" | "TG" | "TTS" | "STS";

// export const LOCAL_AI_STT_MODEL_ID = "moonshine-base-ONNX";
export const LOCAL_AI_STT_MODEL_ID = "whisper-base";
export const LOCAL_AI_STT_SETTINGS: ModelSettings = {
    dtype: "fp32",
    device: "webgpu",
};

export const LOCAL_AI_TEXT_GENERATOR_MODEL_ID = "LFM2-1.2B-ONNX";
export const LOCAL_AI_TEXT_GENERATOR_SETTINGS: ModelSettings = {
    dtype: "q4",
    device: "webgpu",
};

export const LOCAL_AI_TTS_MODEL_ID = "Kokoro-82M-v1.0-ONNX";
export const LOCAL_AI_TTS_SETTINGS: ModelSettings = {
    dtype: "fp32",
    device: "webgpu",
};
