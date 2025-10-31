"use client";

import { useEffect, useRef, useState } from "react";

import { useMicVAD } from "@ricky0123/vad-react";

import { TalkWithAiMessage } from "@/workers/talk-with-ai-worker";
import { ModelType } from "@/transformers-js/configs";
import { Progress } from "@/components/ui/progress";
import { ProgressInfo } from "@huggingface/transformers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import { HomeMicVad } from "../components/home-mic-vad";

interface ModelLoadingProgress {
    status: ProgressInfo["status"];
    progress: number;
    info: string;
}

export const HomeView = () => {
    const talkWithAIWorker = useRef<Worker>(null);
    const [status, setStatus] = useState<TalkWithAiMessage["status"]>("init");
    const [modelLoadingProgress, setModelLoadingProgress] = useState<
        Partial<ModelLoadingProgress>
    >({});
    const streamingBlob: Blob[] = [];

    useEffect(() => {
        talkWithAIWorker.current ??= new Worker(
            new URL("@/workers/talk-with-ai-worker.ts", import.meta.url),
            {
                type: "module",
            }
        );

        talkWithAIWorker.current?.addEventListener(
            "message",
            onMessageReceived
        );

        return () => {
            talkWithAIWorker.current?.removeEventListener(
                "message",
                onMessageReceived
            );
            talkWithAIWorker.current = null;
        };
    }, [talkWithAIWorker]);

    const postMessage = (message: TalkWithAiMessage) => {
        talkWithAIWorker.current?.postMessage(message);
    };

    const onMessageReceived = (e: MessageEvent) => {
        const receivedMessage = e.data as TalkWithAiMessage;

        switch (receivedMessage.type) {
            case "INIT":
                onModelLoadingInfoReceived(
                    receivedMessage.data as ProgressInfo
                );
                break;

            case "STT":
                console.log("STT: ", receivedMessage.data);
                break;

            case "TTT":
                console.log("TTT: ", receivedMessage.data);
                break;

            case "TTS":
                console.log("TTS: ", receivedMessage.data);
                break;

            case "STS":
                console.log("STS: ", receivedMessage.data);

                setStatus("speaking");

                if (receivedMessage.status !== "ended") {
                    streamingBlob.push(receivedMessage.data as Blob);
                }
                if (receivedMessage.status === "start") {
                    playTTSStreamAudio();
                }
                break;
        }
    };

    const onInitModel = (modelType: ModelType) => {
        setStatus("loading");
        postMessage({
            type: "INIT",
            status: "init",
            data: modelType,
        });
    };

    const onModelLoadingInfoReceived = (info: ProgressInfo) => {
        console.log(info);

        const loadingProgress = {
            status: info.status,
            progress: modelLoadingProgress.progress,
            info: "",
        };

        if (info.status === "progress") {
            loadingProgress.progress = info.progress;
        }

        if (info.status === "ready") {
            loadingProgress.info = `${info.model} is ready.`;
            if (info.model === "STT") {
                setStatus("ready");
            }
        } else {
            loadingProgress.info = `${info.status.toUpperCase()}: ${
                info.name
            }/${info.file}.`;
        }

        setModelLoadingProgress(loadingProgress);
    };

    const playTTSStreamAudio = (): void => {
        const blob = streamingBlob.shift();

        if (blob) {
            const audio = new Audio();
            audio.src = URL.createObjectURL(blob);
            audio.onended = () => {
                playTTSStreamAudio();
            };
            audio.play();
        } else {
            setStatus("ready");
        }
    };

    const statusMap = (status: TalkWithAiMessage["status"]) => {
        switch (status) {
            case "init":
                return (
                    <Button onClick={() => onInitModel("STS")}>
                        Load model
                    </Button>
                );

            case "loading":
                return (
                    <Button disabled={true}>
                        <LoaderCircle className="animate-spin" /> Loading model
                    </Button>
                );

            default:
                return (
                    <HomeMicVad
                        {...{
                            status,
                            setStatus,
                            postMessage,
                        }}
                    />
                );
        }
    };

    return (
        <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
            <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
                <div className="flex flex-col w-2xl gap-y-3 items-center justify-center">
                    <div>{modelLoadingProgress.info}</div>
                    <div
                        className={cn(
                            modelLoadingProgress.status === "progress"
                                ? "visible"
                                : "invisible"
                        )}
                    >
                        {modelLoadingProgress.progress?.toFixed(2) + "%"}
                    </div>
                    <Progress value={modelLoadingProgress.progress} />
                    {statusMap(status)}
                </div>
            </div>
        </div>
    );
};
