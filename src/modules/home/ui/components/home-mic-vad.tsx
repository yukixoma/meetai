import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import { Check, LoaderCircle, Phone } from "lucide-react";

import { cn } from "@/lib/utils";

import { MicVAD } from "@ricky0123/vad-web";

import { InferenceMessage, Message } from "@/workers/talk-with-ai-worker";
import { ProgressInfo } from "@huggingface/transformers";

interface HomeMicVadProps {
    modelStatus: ProgressInfo;
    setModelStatus: (modelStatus: ProgressInfo) => void;
    inferenceStatus: InferenceMessage["status"];
    setInferenceStatus: (inferenceStatus: InferenceMessage["status"]) => void;
    postMessage: (message: Message) => void;
}

export const HomeMicVad = ({
    inferenceStatus,
    setInferenceStatus,
    setModelStatus,
    postMessage,
}: HomeMicVadProps) => {
    const myVAD = useRef<MicVAD | null>(null);

    useEffect(() => {
        if (myVAD.current === null) {
            MicVAD.new({
                onnxWASMBasePath:
                    "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/",
                baseAssetPath:
                    "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
                startOnLoad: false,
                onSpeechRealStart: () => {
                    setInferenceStatus("streaming");
                },
                onSpeechEnd: (audio) => {
                    setInferenceStatus("inferencing");
                    myVAD.current?.pause();
                    postMessage({
                        type: "STS",
                        status: "ready",
                        data: audio,
                    });
                },
            }).then((micVad) => {
                myVAD.current = micVad;
                setModelStatus({
                    status: "ready",
                    task: "VAD",
                    model: "VAD",
                });
                setInferenceStatus("ready");
            });
        }

        return () => {
            myVAD.current = null;
        };
    }, []);

    const inferenceStatusMapRender = () => {
        switch (inferenceStatus) {
            case "streaming":
                return (
                    <div className="flex flex-row gap-x-2 items-center justify-center text-cyan-300">
                        <Phone className="animate-bounce" />
                        Streaming
                    </div>
                );

            case "done":
                return (
                    <div className="flex flex-row gap-x-2 items-center justify-center text-cyan-300">
                        <Phone className="animate-bounce" />
                        Streaming
                    </div>
                );

            case "inferencing":
                return (
                    <div className="flex flex-row gap-x-2 items-center justify-center capitalize text-amber-300">
                        <LoaderCircle className="animate-spin" />
                        Inferencing
                    </div>
                );

            case "ready":
                return (
                    <div className="flex flex-row gap-x-2 items-center justify-center capitalize text-green-300">
                        <Check className="animate-pulse" />
                        Ready
                    </div>
                );
        }
    };

    return (
        <>
            {inferenceStatusMapRender()}
            <Button
                disabled={myVAD.current !== null && inferenceStatus !== "ready"}
                onClick={() => {
                    setInferenceStatus("streaming");
                    myVAD.current?.start();
                }}
                className={cn(myVAD.current === null && "bg-amber-300")}
            >
                {myVAD.current === null ? (
                    <>
                        <LoaderCircle className="animate-spin" />
                        Loading VAD model
                    </>
                ) : (
                    "Click here to start talking"
                )}
            </Button>
        </>
    );
};
