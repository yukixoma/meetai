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
    const mediaRecorderRef = useRef<MediaRecorder>(null);
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
                    mediaRecorderRef.current = mediaRecorder;
                    mediaRecorderRef.current.start();
                    setMediaRecorder(mediaRecorderRef.current);
                });
        } else if (!audioBlob) {
            mediaRecorderRef.current?.stop();
        }
    }, [inferenceStatus, audioBlob]);

    useEffect(() => {
        if (audioBlob) {
            mediaRecorderRef.current?.stop();

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
                    mediaRecorderRef.current = new MediaRecorder(stream);
                    mediaRecorderRef.current.start();
                    setMediaRecorder(mediaRecorderRef.current);
                }
            };

            audio.onended = () => {
                URL.revokeObjectURL(audio.src);
                mediaRecorderRef.current?.stop();
                setIsPlaying(false);
                getAudioBlob();
            };

            audio.play();
        }
        return () => {
            mediaRecorderRef.current?.stop();
            mediaRecorderRef.current = null;
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
