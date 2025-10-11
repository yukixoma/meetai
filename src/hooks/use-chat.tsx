"use client";

import { useState, useEffect } from "react";
import puter, { ChatOptions } from "@heyputer/puter.js";

interface UseChatOptions {
    prompt: string;
    testMode?: boolean;
    options?: ChatOptions;
}

export const useChat = (): [
    message: string,
    setPromt: (chatOptions: UseChatOptions) => void
] => {
    const [chatOptions, setChatOptions] = useState<UseChatOptions>({
        prompt: "",
        testMode: undefined,
        options: undefined,
    });
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (chatOptions.prompt !== "") {
            puter.ai
                .chat(
                    chatOptions.prompt,
                    chatOptions.testMode,
                    chatOptions.options
                )
                .then((response) => {
                    setMessage(response.message.content);
                });
        }
        return () => {};
    }, [chatOptions]);

    return [message, setChatOptions];
};
