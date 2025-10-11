import { useState, useEffect } from "react";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

import type { Channel as StreamChannel } from "stream-chat";
import {
    Channel,
    Chat,
    MessageInput,
    MessageList,
    Thread,
    useCreateChatClient,
    Window,
} from "stream-chat-react";

import "stream-chat-react/dist/css/v2/index.css";
import { LoadingState } from "@/components/loading-state";
import { generateAvatarUri } from "@/lib/avatar";

interface ChatUIProps {
    meetingId: string;
    meetingName: string;
    userId: string;
    userName: string;
    userImage: string | null | undefined;
}

export const ChatUI = ({
    meetingId,
    meetingName,
    userId,
    userName,
    userImage,
}: ChatUIProps) => {
    const trpc = useTRPC();
    const { mutateAsync: generateChatToken } = useMutation(
        trpc.meetings.generateChatToken.mutationOptions({})
    );

    const [channel, setChannel] = useState<StreamChannel>();
    const client = useCreateChatClient({
        apiKey: process.env.NEXT_PUBLIC_STREAM_CHAT_API_KEY!,
        tokenOrProvider: generateChatToken,
        userData: {
            id: userId,
            name: userName,
            image: userImage ?? "",
        },
    });

    useEffect(() => {
        if (!client) return;

        const channel = client.channel("messaging", meetingId, {
            members: [userId],
        });

        setChannel(channel);
    }, [client, meetingId, meetingName, userId]);

    if (!client) {
        return (
            <LoadingState
                title="Loading chat"
                description="This may take a few seconds"
            />
        );
    }

    return (
        <div className="bg-white rounded-lg border overflow-hidden">
            <Chat {...{ client }}>
                <Channel {...{ channel }}>
                    <Window>
                        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-23rem)] border-b">
                            <MessageList />
                        </div>
                        <MessageInput />
                    </Window>
                    <Thread />
                </Channel>
            </Chat>
        </div>
    );
};
