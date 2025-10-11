import OpenAI from "openai";

export const openAIClient = new OpenAI({
    baseURL: "http://localhost:8080/api/v1",
    apiKey: "not-needed",
    defaultHeaders: {
        Authorization: "Bearer sk-e89cbb5e27e94f18b08daf773e60481c",
    },
});
