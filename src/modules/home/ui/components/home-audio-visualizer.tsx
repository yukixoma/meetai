import { useEffect, useRef, useState } from "react";

import { LiveAudioVisualizer } from "@tecsinapse/react-audio-visualize";

import { InferenceMessage } from "@/workers/talk-with-ai-worker";

interface HTMLAudioElementExtended extends HTMLAudioElement {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
}

interface HomeAudioVisualizerProps {
    inferenceStatus: InferenceMessage["status"];
    audioBlob?: { part: number; data: Blob };
    getAudioBlob: (part: number) => void;
}

export const HomeAudioVisualizer = ({
    inferenceStatus,
    audioBlob,
    getAudioBlob,
}: HomeAudioVisualizerProps) => {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
        null
    );
    const audioBlobPartRef = useRef<number>(null);

    useEffect(() => {
        if (audioBlob === undefined) {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    const newMediaRecorder = new MediaRecorder(stream);
                    if (inferenceStatus === "streaming") {
                        newMediaRecorder.start();
                    }
                    setMediaRecorder(newMediaRecorder);
                });
        }
        return () => {
            mediaRecorder?.stop();
            setMediaRecorder(null);
        };
    }, [inferenceStatus]);

    useEffect(() => {
        if (
            audioBlob !== undefined &&
            audioBlob.part !== audioBlobPartRef.current
        ) {
            audioBlobPartRef.current = audioBlob.part;

            const audio = new Audio() as HTMLAudioElementExtended;
            audio.src = URL.createObjectURL(audioBlob.data);
            audio.onended = () => {
                setMediaRecorder(null);
                getAudioBlob(audioBlob.part + 1);
            };

            audio.play().then(() => {
                const stream =
                    audio.captureStream?.() ?? audio.mozCaptureStream?.();
                if (stream) {
                    const newMediaRecorder = new MediaRecorder(stream);
                    newMediaRecorder.start();
                    setMediaRecorder(newMediaRecorder);
                }
            });
        }

        return () => {
            audioBlobPartRef.current = null;
            mediaRecorder?.stop();
            setMediaRecorder(null);
        };
    }, [audioBlob]);

    return (
        <div className="flex flex-col h-20 items-center justify-center">
            {mediaRecorder !== null && (
                <LiveAudioVisualizer
                    mediaRecorder={mediaRecorder}
                    width={200}
                    height={75}
                    barWidth={2}
                    gap={2}
                />
            )}
        </div>
    );
};
