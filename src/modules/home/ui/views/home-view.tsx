"use client";

import {
    useCallback,
    useEffect,
    useEffectEvent,
    useRef,
    useState,
} from "react";

import { Bitcount_Single } from "next/font/google";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import { ModelType } from "@/onnx/configs";

import {
    InferenceMessage,
    InitMessage,
    Message,
} from "@/workers/talk-with-ai-worker";

import { HomeMicVad } from "../components/home-mic-vad";
import { HomeAudioVisualizer } from "../components/home-audio-visualizer";

const bitcountSingle = Bitcount_Single({
    subsets: ["latin"],
});

export const HomeView = () => {
    const talkWithAIWorker = useRef<Worker>(null);

    const [modelStatus, setModelStatus] = useState<InitMessage>();

    const [inferenceStatus, setInferenceStatus] = useState<InferenceMessage>();

    const audioBlobArrayRef = useRef<Blob[]>([]);
    const [audioBlob, setAudioBlob] = useState<Blob>();
    const [isPlaying, setIsPlaying] = useState(false);

    const onMessage = useEffectEvent((e: MessageEvent) => {
        const message = e.data as Message;

        switch (message.type) {
            case "INIT":
                setModelStatus(message);
                break;
            case "INFERENCE":
                setInferenceStatus(message);

                switch (message.modelType) {
                    case "TTS":
                        if (message.status === "streaming") {
                            const { part, data } = message.data as {
                                part: number;
                                data: ArrayBuffer;
                            };

                            const blob = new Blob([data], {
                                type: "audio/wav",
                            });

                            if (part === 0) {
                                setAudioBlob(blob);
                            } else {
                                audioBlobArrayRef.current.push(blob);
                            }
                        }

                        break;

                    case "STS":
                        setInferenceStatus({
                            type: "INFERENCE",
                            modelType: "VAD",
                            status: "ready",
                            data: "",
                        });
                        break;
                }
        }
    });

    const playAudio = () => {
        const audioBlob = audioBlobArrayRef.current.shift();
        if (audioBlob) {
            const audio = new Audio(URL.createObjectURL(audioBlob));
            audio.onended = () => {
                URL.revokeObjectURL(audio.src);
                playAudio();
            };
            audio.play();
        }
    };

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
            talkWithAIWorker.current?.postMessage({
                type: "DISPOSE",
                status: "disposed",
            });
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
            modelType: modelType,
        });
    };

    const getAudioBlob = useCallback(() => {
        const audioBlob = audioBlobArrayRef.current.shift();

        if (audioBlob) {
            setIsPlaying(true);
            setAudioBlob(audioBlob);
        } else if (inferenceStatus?.status !== "ready") {
            setTimeout(() => {
                getAudioBlob();
            }, 50);
        } else {
            setAudioBlob(undefined);
            setIsPlaying(false);
        }
    }, [inferenceStatus]);

    const modelStatusMapRender = () => {
        if (!modelStatus?.data) {
            return (
                <>
                    <div className={cn("text-2xl", bitcountSingle.className)}>
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
        }

        const { modelType, data } = modelStatus;

        if (modelType !== "STS" && modelType !== "VAD") {
            let title = "";
            let subtitle = "";
            let textColor = "";
            let progress = 0;
            if (data.status !== "ready") {
                const { file, name } = data;
                subtitle = `${name}/${file}`;
                switch (data.status) {
                    case "initiate":
                        title = `Initiating model ${name}`;
                        subtitle = `Preparing to download ${name}/${file}`;

                        break;

                    case "download":
                        title = `Downloading model ${name}`;
                        subtitle = `Downloading ${name}/${file}`;
                        textColor = "text-amber-300";
                        break;

                    case "progress":
                        title = `Processing model ${name}`;
                        progress = data.progress;
                        subtitle = `Processing ${name}/${file} (${progress.toFixed(
                            2
                        )} %)`;
                        textColor = "text-amber-300";
                        break;

                    case "done":
                        title = `Loaded model ${name}`;
                        subtitle = "Finalizing";
                        textColor = "text-cyan-300";
                        progress = 100;
                        break;
                }
            } else {
                title = `Model ${data.model} is ready`;
                subtitle = "Waiting for other models";
                textColor = "text-green-300";
                progress = 100;
            }

            return (
                <>
                    <div className={cn("text-2xl", bitcountSingle.className)}>
                        {title}
                    </div>
                    <div className="flex flex-col h-20 items-center justify-center">
                        <div
                            className={cn(
                                "flex flex-row gap-x-1 h-10",
                                textColor
                            )}
                        >
                            <LoaderCircle className="animate-spin" />
                            {subtitle}
                        </div>
                        <div className="flex flex-col w-3xs items-center justify-center">
                            <Progress {...{ value: progress }} />
                        </div>
                    </div>
                    <Button disabled>Loading model</Button>
                </>
            );
        }

        if (modelType === "STS" || modelType === "VAD") {
            return (
                <>
                    <div className={cn("text-2xl", bitcountSingle.className)}>
                        Talk.AI is ready
                    </div>
                    <HomeAudioVisualizer
                        {...{
                            inferenceStatus,
                            audioBlob,
                            getAudioBlob,
                            setIsPlaying,
                        }}
                    />
                    <HomeMicVad
                        {...{
                            modelStatus,
                            setModelStatus,
                            inferenceStatus,
                            setInferenceStatus,
                            isPlaying,
                            postMessage,
                        }}
                    />
                </>
            );
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
