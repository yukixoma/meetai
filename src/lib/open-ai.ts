import OpenAI from "openai";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";

export interface HTMLAudioElementExtended extends HTMLAudioElement {
    captureStream: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
}

const openAIClient = new OpenAI({
    baseURL: "http://localhost:8080/api/v1",
    apiKey: "not-needed",
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
        Authorization: "Bearer sk-e89cbb5e27e94f18b08daf773e60481c",
    },
});

export const speechToText = async ({
    file,
}: {
    file: File;
}): Promise<string> => {
    const speechToTextResponse = await openAIClient.audio.transcriptions.create(
        {
            file: file,
            model: "whisper",
        }
    );

    const { text: message } = speechToTextResponse;
    return message;
};

export const textToSpeech = async ({
    message,
}: {
    message: string;
}): Promise<HTMLAudioElementExtended> => {
    const textToSpeechResponse = await openAIClient.audio.speech.create({
        input: message,
        model: "kokoro",
        voice: "alloy",
        response_format: "wav",
    });

    const audio = new Audio() as HTMLAudioElementExtended;
    audio.src = URL.createObjectURL(await textToSpeechResponse.blob());
    return audio;
};

export const chatWithAI = async (
    body: ChatCompletionCreateParamsNonStreaming
): Promise<string> => {
    const AIChatResponse = await openAIClient.chat.completions.create(body);

    const message = AIChatResponse.choices[0].message.content ?? "";
    return message;
};

export default openAIClient;
