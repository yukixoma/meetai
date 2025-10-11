import { LoadingState } from "@/components/loading-state";
import { authClient } from "@/lib/auth-client";
import { ChatUI } from "./chat-ui";
import { generateAvatarUri } from "@/lib/avatar";

interface ChatProviderProps {
    meetingId: string;
    meetingName: string;
}

export const ChatProvider = ({ meetingId, meetingName }: ChatProviderProps) => {
    const { data, isPending } = authClient.useSession();

    if (isPending || !data?.user) {
        return (
            <LoadingState
                title="Loading"
                description="Please wait while we load the chat"
            />
        );
    }

    const { id: userId, name: userName, image: userImage } = data.user;

    return (
        <ChatUI
            {...{
                meetingId,
                meetingName,
                userId,
                userName,
                userImage:
                    userImage ??
                    generateAvatarUri({ seed: userName, variant: "initials" }),
            }}
        />
    );
};
