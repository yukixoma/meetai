import { useState } from "react";

import { StreamTheme, useCall } from "@stream-io/video-react-sdk";

import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";

export const CallUI = ({ meetingName }: { meetingName: string }) => {
    const call = useCall();
    const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");

    const handleJoin = async () => {
        if (!call) return;

        await call.join();

        setShow("call");
    };

    const handleLeave = async () => {
        if (!call) return;

        await call.endCall();

        setShow("ended");
    };

    const callMap = {
        lobby: <CallLobby {...{ onJoin: handleJoin }} />,
        call: <CallActive {...{ meetingName, onLeave: handleLeave }} />,
        ended: <CallEnded />,
    };

    return <StreamTheme className="h-full">{callMap[show]}</StreamTheme>;
};
