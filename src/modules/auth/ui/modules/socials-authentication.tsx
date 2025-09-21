import { Dispatch, SetStateAction } from "react";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";

import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

interface SocialsAuthenticationProps {
    pending: boolean;
    setPending: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<string | null>>;
}

export const SocialsAuthentication = ({
    pending,
    setPending,
    setError,
}: SocialsAuthenticationProps) => {
    const onSocial = (provider: "github" | "google") => {
        authClient.signIn.social(
            {
                provider: provider,
                callbackURL: "/",
            },
            {
                onRequest: () => setPending(true),
                onError: ({ error: { message } }) => {
                    setPending(false);
                    setError(message);
                },
            }
        );
    };

    return (
        <>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or continue with
                </span>
            </div>
            <div className="grid grid-cols-2 gap-4 ">
                <Button
                    disabled={pending}
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => onSocial("google")}
                >
                    <FcGoogle />
                </Button>
                <Button
                    disabled={pending}
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => onSocial("github")}
                >
                    <FaGithub />
                </Button>
            </div>
        </>
    );
};
