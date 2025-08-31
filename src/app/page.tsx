"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

import { useState } from "react";

export default function Home() {
    const { data: session } = authClient.useSession();

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    const onSignup = () => {
        authClient.signUp.email(
            {
                email,
                name,
                password,
            },
            {
                onError: (ctx) => window.alert(ctx.error.message),
                onSuccess: () => window.alert("Success!"),
            }
        );
    };

    const onSignin = () => {
        authClient.signIn.email(
            {
                email,
                password,
            },
            {
                onError: (ctx) => window.alert(ctx.error.message),
                onSuccess: () => window.alert("Success!"),
            }
        );
    };

    if (session) {
        return (
            <div className="flex flex-col p-4 gap-y-4">
                <p>Logged in as {session.user.name}</p>
                <Button onClick={() => authClient.signOut()}>Sign out</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-y-10">
            <div className="p-4 flex flex-col gap-y-4">
                <Input
                    placeholder="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    placeholder="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    placeholder="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button onClick={onSignup}>Create user</Button>
            </div>

            <div className="p-4 flex flex-col gap-y-4">
                <Input
                    placeholder="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    placeholder="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button onClick={onSignin}>Sign in</Button>
            </div>
        </div>
    );
}
