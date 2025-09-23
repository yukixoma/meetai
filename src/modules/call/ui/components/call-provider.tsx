import { authClient } from "@/lib/auth-client";

import { LoaderIcon } from "lucide-react";

import { generateAvatarUri } from "@/lib/avatar";

import { CallConnect } from "./call-connect";

interface CallProviderProps {
    meetingId: string;
    meetingName: string;
}

export const CallProvider = ({ meetingId, meetingName }: CallProviderProps) => {
    const { data, isPending } = authClient.useSession();

    if (!data || isPending) {
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
                <LoaderIcon className="size-6 animate-spin text-white" />
            </div>
        );
    }

    const { name: userName, id: userId, image: userImage } = data.user;

    return (
        <div className="h-full">
            <CallConnect
                {...{ meetingId, meetingName, userId, userName }}
                userImage={
                    userImage ??
                    generateAvatarUri({
                        seed: userName,
                        variant: "initials",
                    })
                }
            />
        </div>
    );
};
