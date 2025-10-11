"use client";

import { useChat } from "@/hooks/use-chat";

export const HomeView = () => {
    const [message, setChatOptions] = useChat();

    return (
        <>
            <div className="flex flex-col p-4 gap-y-4">{message}</div>
            <input type="text" id="input" />
            <button
                onClick={() => {
                    const input = document.getElementById(
                        "input"
                    ) as HTMLInputElement;
                    const prompt = input.value;
                    setChatOptions({ prompt });
                }}
            >
                onClick
            </button>
        </>
    );
};
