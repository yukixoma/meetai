import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import { Check, LoaderCircle, Phone, X } from "lucide-react";

import { MicVAD } from "@ricky0123/vad-web";

import {
    InferenceMessage,
    InitMessage,
    Message,
} from "@/workers/talk-with-ai-worker";

interface HomeMicVadProps {
    setModelStatus: (modelStatus: InitMessage) => void;
    inferenceStatus?: InferenceMessage;
    setInferenceStatus: (inferenceStatus: InferenceMessage) => void;
    isPlaying: boolean;
    postMessage: (message: Message) => void;
}

export const HomeMicVad = ({
    setModelStatus,
    inferenceStatus,
    setInferenceStatus,
    isPlaying,
    postMessage,
}: HomeMicVadProps) => {
    const myVAD = useRef<MicVAD>(null);

    useEffect(() => {
        if (myVAD.current === null) {
            MicVAD.new({
                onnxWASMBasePath:
                    "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/",
                baseAssetPath:
                    "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/",
                startOnLoad: false,
                onSpeechEnd: (audio) => {
                    myVAD.current?.pause();

                    postMessage({
                        type: "INFERENCE",
                        modelType: "STS",
                        status: "ready",
                        data: audio,
                    });

                    setInferenceStatus({
                        type: "INFERENCE",
                        modelType: "VAD",
                        status: "ready",
                        data: "",
                    });
                },
            }).then((micVad) => {
                myVAD.current = micVad;

                setModelStatus({
                    type: "INIT",
                    modelType: "VAD",
                    data: {
                        status: "ready",
                        task: "init",
                        model: "VAD",
                    },
                });

                setInferenceStatus({
                    type: "INFERENCE",
                    modelType: "VAD",
                    status: "ready",
                    data: "",
                });
            });
        }

        return () => {
            if (myVAD.current instanceof MicVAD) {
                try {
                    myVAD.current.destroy();
                } catch (error) {}
            }
            myVAD.current = null;
        };
    }, []);

    const onStartVAD = () => {
        myVAD.current?.start();
        setInferenceStatus({
            type: "INFERENCE",
            modelType: "VAD",
            status: "streaming",
            data: "",
        });
    };

    if (!inferenceStatus) {
        return (
            <>
                <div className="flex flex-row gap-x-2 items-center justify-center capitalize text-amber-300">
                    <LoaderCircle className="animate-spin" />
                    Loading VAD model
                </div>
                <Button disabled>Click here to start talking</Button>
            </>
        );
    }

    switch (inferenceStatus.status) {
        case "inferencing":
            return (
                <>
                    <div className="flex flex-row gap-x-2 items-center justify-center capitalize text-amber-300">
                        <LoaderCircle className="animate-spin" />
                        Inferencing ({inferenceStatus.modelType})
                    </div>
                    <Button disabled>Click here to start talking</Button>
                </>
            );

        case "streaming":
            return (
                <>
                    <div className="flex flex-row gap-x-2 items-center justify-center text-cyan-300">
                        <Phone className="animate-bounce" />
                        Streaming ({inferenceStatus.modelType})
                    </div>
                    <Button disabled>Click here to start talking</Button>
                </>
            );

        case "ready":
            return (
                <>
                    <div className="flex flex-row gap-x-1 items-center justify-center capitalize text-green-300">
                        <Check className="animate-pulse" />
                        Ready
                    </div>
                    <Button
                        disabled={
                            inferenceStatus.status !== "ready" ||
                            inferenceStatus.modelType !== "VAD" ||
                            isPlaying
                        }
                        onClick={onStartVAD}
                    >
                        Click here to start talking
                    </Button>
                </>
            );

        case "error":
            return (
                <>
                    <div className="flex flex-row gap-x-1 items-center justify-center capitalize text-green-300">
                        <X className="animate-pulse" />
                        Error
                    </div>
                    <Button
                        onClick={() => {
                            window.location.reload();
                        }}
                    >
                        Reload page
                    </Button>
                </>
            );
    }
};
