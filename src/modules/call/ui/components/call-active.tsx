import Link from "next/link";
import Image from "next/image";

import {
    CallControls,
    SpeakerLayout,
    useCall,
    useCallStateHooks,
} from "@stream-io/video-react-sdk";

import { Button } from "@/components/ui/button";

import { speechToText } from "@/lib/open-ai";

interface CallActiveProps {
    onLeave: () => void;
    meetingName: string;
}

export const CallActive = ({ onLeave, meetingName }: CallActiveProps) => {
    const call = useCall();
    const { useMicrophoneState } = useCallStateHooks();

    const { mediaStream } = useMicrophoneState();
    let mediaRecorder: MediaRecorder;

    const onTalk = async () => {
        if (!call || !mediaStream) return;

        await call.sendCustomEvent({
            type: "on_mute",
        });

        console.log("record started");
        mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.start();
    };

    const onSend = async () => {
        if (!call || !mediaRecorder) return;

        await call.sendCustomEvent({
            type: "on_unmute",
        });

        console.log("record stopped");
        mediaRecorder.stop();
        mediaRecorder.ondataavailable = async (event: BlobEvent) => {
            const file = new File([event.data], "record.ogg", {
                type: "audio/ogg; codecs=opus",
            });

            // Speech to text
            const message = await speechToText({ file });
            console.log(`STT: ${message}`);

            await call.sendCustomEvent({
                type: "on_send_message",
                message,
            });

            await call.microphone.disable();
        };
    };

    return (
        <div className="flex flex-col justify-between p-4 h-full text-white">
            <div className="bg-[#101213] rounded-full p-4 flex items-center gap-4">
                <Link
                    href="/"
                    className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit"
                >
                    <Image src="/logo.svg" width={22} height={22} alt="Logo" />
                </Link>
                <h4 className="text-base">{meetingName}</h4>
            </div>
            <SpeakerLayout />
            <div className="bg-[#101213] rounded-full px-4">
                <CallControls {...{ onLeave }} />
            </div>
            <div className="flex items-center justify-center gap-4">
                <Button onClick={() => onTalk()}>Talk</Button>
                <Button onClick={() => onSend()}>Send</Button>
            </div>
        </div>
    );
};
