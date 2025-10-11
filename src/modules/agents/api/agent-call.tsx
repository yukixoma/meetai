"use client";

import { useEffect, useState } from "react";

import { useTRPC } from "@/trpc/client";

import { useSuspenseQuery } from "@tanstack/react-query";

import {
    Call,
    CallControls,
    CallingState,
    CustomVideoEvent,
    SpeakerLayout,
    StreamCall,
    StreamTheme,
    StreamVideo,
    StreamVideoClient,
    useCall,
} from "@stream-io/video-react-sdk";

import { Button } from "@/components/ui/button";

import { generateAvatarUri } from "@/lib/avatar";

import {
    HTMLAudioElementExtended,
    chatWithAI,
    textToSpeech,
} from "@/lib/open-ai";

import "@stream-io/video-react-sdk/dist/css/styles.css";

interface AgentStreamVideoProps {
    token: string;
    meetingId: string;
    agentId: string;
}

export const AgentStreamVideo = ({
    token,
    meetingId,
    agentId,
}: AgentStreamVideoProps) => {
    const trpc = useTRPC();
    const { data: meeting } = useSuspenseQuery(
        trpc.meetings.getOne.queryOptions({ id: meetingId })
    );

    const [client, setClient] = useState<StreamVideoClient>();
    useEffect(() => {
        const _client = new StreamVideoClient({
            apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
            token,
            user: {
                id: meeting.agentId,
                name: meeting.agent.name,
                image: generateAvatarUri({
                    seed: meeting.agent.name,
                    variant: "botttsNeutral",
                }),
            },
        });
        setClient(_client);

        return () => {
            _client.disconnectUser();
            setClient(undefined);
        };
    }, [meeting, token]);

    const [call, setCall] = useState<Call>();
    useEffect(() => {
        if (!client) return;

        const _call = client.call("default", meetingId);
        _call.camera.disable();
        _call.microphone.disable();

        setCall(_call);

        return () => {
            if (_call.state.callingState === CallingState.LEFT) {
                _call.leave();
                setCall(undefined);
            }
        };
    }, [meetingId, client]);

    if (!client || !call) {
        return <div />;
    }

    return (
        <div className="h-full">
            <StreamVideo {...{ client }}>
                <StreamCall {...{ call }}>
                    <AgentCall {...{ agentId }} />
                </StreamCall>
            </StreamVideo>
        </div>
    );
};

export const AgentCall = ({ agentId }: { agentId: string }) => {
    const trpc = useTRPC();
    const { data: agent } = useSuspenseQuery(
        trpc.agents.getOne.queryOptions({ id: agentId })
    );

    const call = useCall();
    const [audio, setAudio] = useState<HTMLAudioElementExtended>();

    useEffect(() => {
        if (!call) return;

        const unsubscribeCustomEvents = call.on(
            "custom",
            async (event: CustomVideoEvent) => {
                const payload = event.custom;

                if (payload.type === "on_send_message") {
                    await onAnswer(payload.message);
                }

                if (payload.type === "on_mute") {
                    await call.microphone.disable();
                }

                if (payload.type === "on_unmute") {
                    await call.microphone.enable();
                }
            }
        );

        return () => {
            unsubscribeCustomEvents();
        };
    }, [call]);

    useEffect(() => {
        if (!audio || !call) return;

        const { unregister: unregisterAudioFilter } =
            call.microphone.registerFilter(function createResponseStream() {
                let outputStream: MediaStream;

                if (audio.mozCaptureStream) {
                    outputStream = audio.mozCaptureStream();
                } else {
                    outputStream = audio.captureStream();
                }

                return {
                    output: outputStream,
                    stop: () => {
                        setAudio(undefined);
                    },
                };
            });

        audio.play();

        return () => {
            unregisterAudioFilter();
        };
    }, [call, audio]);

    const onJoin = async () => {
        if (call) {
            await call.join();
        }
    };

    const onAnswer = async (message: string) => {
        if (!message) return;

        // Chat with A.I
        message = await chatWithAI({
            model: "gemma3:4b-it-qat",
            messages: [
                {
                    role: "system",
                    content: agent.instructions,
                },
                {
                    role: "user",
                    content: message,
                },
            ],
        });
        console.log(`AI chat: ${message}`);

        // Text to speech
        const audio = await textToSpeech({ message });
        audio.onended = async () => {
            setAudio(undefined);
        };

        setAudio(audio);
    };

    const onLeave = async () => {
        await call?.leave();
        window.close();
    };

    return (
        <StreamTheme className="h-full">
            <div className="flex flex-col justify-between p-4 h-full text-white">
                <SpeakerLayout />
                <div className="bg-[#101213] rounded-full px-4">
                    <CallControls {...{ onLeave }} />
                </div>
                <Button onClick={onJoin} id="join-call">
                    Join
                </Button>
            </div>
        </StreamTheme>
    );
};
