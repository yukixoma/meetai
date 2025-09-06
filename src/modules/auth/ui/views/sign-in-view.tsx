"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { FaGithub, FaSignInAlt, FaSpinner } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OctagonAlertIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
    email: z.email(),
    password: z.string().min(1, { error: "Password is required!" }),
});

export const SignInView = () => {
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    /** Sign in with email and password */
    const onSignin = (data: z.infer<typeof formSchema>) => {
        setError(null);
        authClient.signIn.email(
            {
                email: data.email,
                password: data.password,
                callbackURL: "/",
            },
            {
                onRequest: () => setPending(true),
                onError: ({ error: { message } }) => {
                    setError(message);
                    setPending(false);
                },
            }
        );
    };

    /** Sign in using social accounts */
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

    /** Create form controller */
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    return (
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    {/** Sign in form */}
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSignin)}
                            className="p-6 md:p-8"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center text-center">
                                    <h1 className="text-2xl font-bold">
                                        Welcome back!
                                    </h1>
                                    <p className="text-muted-foreground text-balance">
                                        Sign in to your account
                                    </p>
                                </div>
                                {/** Email input */}
                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="a@ex.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {/** Password input */}
                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="********"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {/** Error massage */}
                                {!!error && (
                                    <Alert className="bg-destructive/10 border-none">
                                        <OctagonAlertIcon className="h-4 w-4 !text-destructive" />
                                        <AlertTitle>{error}!</AlertTitle>
                                    </Alert>
                                )}

                                {/** Submit button */}
                                <Button
                                    disabled={pending}
                                    type="submit"
                                    className="w-full"
                                >
                                    {pending ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Signing in
                                        </>
                                    ) : (
                                        <>
                                            <FaSignInAlt />
                                            Sign in
                                        </>
                                    )}
                                </Button>
                                {/** Login with social */}
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
                                {/** Sign up */}
                                <div className="text-center text-sm">
                                    Don&apos;t have an account?{" "}
                                    <Link
                                        href="/sign-up"
                                        className="underline underline-offset-4"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                    {/** Right panel (included logo and some introduction text) */}
                    <div className="bg-radial from-green-500 to-green-800 relative hidden md:flex flex-col gap-y-4 items-center justify-center">
                        <Image
                            src="/logo.svg"
                            alt="Logo image"
                            height={92}
                            width={92}
                            className="h-[92px] w-[92px]"
                        />
                        <p className="text-2xl font-semibold text-white">
                            Meet.AI
                        </p>
                    </div>
                </CardContent>
            </Card>
            {/** Terms of Use */}
            <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                By clicking continue, you agree to our{" "}
                <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a>
            </div>
        </div>
    );
};
