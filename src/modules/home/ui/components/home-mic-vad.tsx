import { Button } from "@/components/ui/button";
import { TalkWithAiMessage } from "@/workers/talk-with-ai-worker";
import { useMicVAD } from "@ricky0123/vad-react";

interface HomeMicVadProps {
    status?: TalkWithAiMessage["status"];
    setStatus: (status: TalkWithAiMessage["status"]) => void;
    postMessage: (message: TalkWithAiMessage) => void;
}

export const HomeMicVad = ({
    status,
    setStatus,
    postMessage,
}: HomeMicVadProps) => {
    const micVad = useMicVAD({
        startOnLoad: false,
        getStream: async () => {
            return await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 2,
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });
        },
        onSpeechEnd: (audio) => {
            micVad.pause();
            console.log("Vad ended: ", audio);
            postMessage({
                type: "STS",
                status: "start",
                data: audio,
            });
        },
        onnxWASMBasePath:
            "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/",
        baseAssetPath:
            "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.28/dist/",
    });

    switch (status) {
        case "ready":
            return (
                <Button
                    onClick={() => {
                        setStatus("listening");
                        micVad.start();
                    }}
                >
                    Click here to start talking
                </Button>
            );

        default:
            return (
                <Button className="capitalize" disabled>
                    {status}
                </Button>
            );
    }
};
