import { RefObject, useEffect, useRef, useState } from "react";

import { LiveAudioVisualizer } from "@tecsinapse/react-audio-visualize";

import { InferenceMessage } from "@/workers/talk-with-ai-worker";

interface HTMLAudioElementExtended extends HTMLAudioElement {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
}

interface HomeAudioVisualizerProps {
    inferenceStatus?: InferenceMessage;
    audioBlob?: Blob;
    getAudioBlob: () => void;
    setIsPlaying: (isPlaying: boolean) => void;
}

export const HomeAudioVisualizer = ({
    inferenceStatus,
    audioBlob,
    getAudioBlob,
    setIsPlaying,
}: HomeAudioVisualizerProps) => {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();

    useEffect(() => {
        if (!inferenceStatus) {
            return;
        }
        const { status, modelType } = inferenceStatus;
        if (status === "streaming" && modelType === "VAD") {
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    setMediaRecorder(mediaRecorder);
                });
        } else if (!audioBlob) {
            mediaRecorder?.stop();
        }
    }, [inferenceStatus, audioBlob]);

    useEffect(() => {
        if (audioBlob) {
            mediaRecorder?.stop();

            const audio = new Audio() as HTMLAudioElementExtended;
            audio.src = URL.createObjectURL(audioBlob);

            audio.onplaying = () => {
                setIsPlaying(true);

                let stream;
                if (audio.captureStream) {
                    stream = audio.captureStream();
                } else if (audio.mozCaptureStream) {
                    stream = audio.mozCaptureStream();
                }
                if (stream) {
                    const mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    setMediaRecorder(mediaRecorder);
                }
            };

            audio.onended = () => {
                URL.revokeObjectURL(audio.src);
                mediaRecorder?.stop();
                setIsPlaying(false);
                getAudioBlob();
            };

            audio.play();
        }
        return () => {
            mediaRecorder?.stop();
            setMediaRecorder(undefined);
        };
    }, [audioBlob]);

    return (
        <div className="flex flex-col h-20 items-center justify-center">
            {mediaRecorder && (
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
