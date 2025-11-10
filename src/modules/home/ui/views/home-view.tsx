"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { Bitcount_Single } from "next/font/google";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import { ProgressInfo } from "@huggingface/transformers";

import { ModelType } from "@/transformers-js/configs";

import { InferenceMessage, Message } from "@/workers/talk-with-ai-worker";

import { HomeMicVad } from "../components/home-mic-vad";
import { HomeAudioVisualizer } from "../components/home-audio-visualizer";

const bitcountSingle = Bitcount_Single({
    subsets: ["latin"],
});

export const HomeView = () => {
    const talkWithAIWorker = useRef<Worker>(null);

    const [inferenceStatus, setInferenceStatus] =
        useState<InferenceMessage["status"]>("initiate");

    const [modelStatus, setModelStatus] = useState<ProgressInfo>({
        status: "initiate",
        file: "",
        name: "",
    });

    const audioBlobArrayRef = useRef<Blob[]>([]);
    const [audioBlob, setAudioBlob] = useState<{
        part: number;
        data: Blob;
    }>();

    const onMessage = useEffectEvent((e: MessageEvent) => {
        const message = e.data as Message;

        switch (message.type) {
            case "INIT":
                setModelStatus(message.data as ProgressInfo);
                break;

            case "STT":
                console.log("STT: ", message);
                break;

            case "TG":
                console.log("TG: ", message.data);
                break;

            case "TTS":
                console.log("TTS: ", message);
                if (message.status === "streaming") {
                    const { part, data } = message.data as {
                        part: number;
                        data: ArrayBuffer;
                    };
                    audioBlobArrayRef.current[part] = new Blob([data], {
                        type: "audio/wav",
                    });
                    if (part === 0) {
                        getAudioBlob(0);
                    }
                }
                break;

            case "STS":
                console.log("STS: ", message);
                setInferenceStatus(message.status);
                break;
        }
    });

    useEffect(() => {
        if (talkWithAIWorker.current === null) {
            talkWithAIWorker.current = new Worker(
                new URL("@/workers/talk-with-ai-worker.ts", import.meta.url),
                {
                    type: "module",
                }
            );

            talkWithAIWorker.current.onmessage = onMessage;
        }

        return () => {
            postMessage({ type: "DISPOSE", status: "disposed" });
            talkWithAIWorker.current?.terminate();
            talkWithAIWorker.current = null;
        };
    }, []);

    const postMessage = (message: Message) => {
        talkWithAIWorker.current?.postMessage(message);
    };

    const onInitModel = (modelType: ModelType) => {
        postMessage({
            type: "INIT",
            status: "initiate",
            data: modelType,
        });
    };

    const getAudioBlob = (part: number) => {
        const blob = audioBlobArrayRef.current[part];

        if (blob) {
            setAudioBlob({
                part: part,
                data: blob,
            });
        } else {
            audioBlobArrayRef.current = [];
            setAudioBlob(undefined);
        }
    };

    const modelStatusMapRender = () => {
        switch (modelStatus.status) {
            case "initiate":
                return (
                    <>
                        <div
                            className={cn("text-2xl", bitcountSingle.className)}
                        >
                            Welcome to Talk.AI
                        </div>
                        <div className="flex flex-col h-20 items-center justify-center">
                            Click load model button to begin
                        </div>
                        <Button onClick={() => onInitModel("STS")}>
                            Load model
                        </Button>
                    </>
                );

            case "download":
                return (
                    <>
                        <div
                            className={cn("text-2xl", bitcountSingle.className)}
                        >
                            Downloading model
                        </div>
                        <div className="flex flex-col h-20 items-center justify-center">
                            <div>
                                {`Downloading ${modelStatus.name}/${modelStatus.file}`}
                            </div>
                            <Button disabled={true}>
                                <LoaderCircle className="animate-spin" />
                                Downloading model
                            </Button>
                        </div>
                    </>
                );

            case "progress":
                return (
                    <>
                        <div
                            className={cn("text-2xl", bitcountSingle.className)}
                        >
                            Loading model
                        </div>
                        <div className="flex flex-col h-20 items-center justify-center">
                            <div>
                                {`Loading ${modelStatus.name}/${modelStatus.file}`}
                            </div>
                            <div>{`${modelStatus.progress.toFixed(2)}%`}</div>
                            <Progress {...{ value: modelStatus.progress }} />
                        </div>
                        <Button disabled={true} className="bg-amber-300">
                            <LoaderCircle className="animate-spin" />
                            Loading model
                        </Button>
                    </>
                );

            case "done":
                return (
                    <>
                        <div
                            className={cn("text-2xl", bitcountSingle.className)}
                        >
                            Loaded model
                        </div>
                        <div className="flex flex-col h-20 items-center justify-center">
                            <div>
                                {`Loaded ${modelStatus.name}/${modelStatus.file}`}
                            </div>
                        </div>
                        <Button disabled={true} className="bg-cyan-300">
                            <LoaderCircle className="animate-spin" />
                            Waiting for another models
                        </Button>
                    </>
                );

            case "ready":
                if (
                    modelStatus.model === "STS" ||
                    modelStatus.model === "VAD"
                ) {
                    return (
                        <>
                            <div
                                className={cn(
                                    "text-2xl",
                                    bitcountSingle.className
                                )}
                            >
                                Talk.AI is ready
                            </div>
                            <HomeAudioVisualizer
                                {...{
                                    inferenceStatus,
                                    audioBlob,
                                    getAudioBlob,
                                }}
                            />
                            <HomeMicVad
                                {...{
                                    modelStatus,
                                    setModelStatus,
                                    inferenceStatus,
                                    setInferenceStatus,
                                    postMessage,
                                }}
                            />
                        </>
                    );
                }
        }
    };

    return (
        <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
            <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
                <div className="flex flex-col w-2xl gap-y-3 items-center justify-center">
                    {modelStatusMapRender()}
                </div>
            </div>
        </div>
    );
};
