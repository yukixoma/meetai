"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

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

import { FaSpinner, FaUserPlus } from "react-icons/fa";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import { OctagonAlertIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";

import { RightPanel } from "../modules/right-panel";
import { SocialsAuthentication } from "../modules/socials-authentication";

const formSchema = z
    .object({
        name: z.string().min(1, { error: "Name is required!" }),
        email: z.email(),
        password: z.string().min(1, { error: "Password is required!" }),
        confirmPassword: z.string().min(1, { error: "Password is required!" }),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
        error: "Passwords don't match!",
        path: ["confirmPassword"],
    });

export const SignUpView = () => {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    /** Sign up with email and password */
    const onSignup = (data: z.infer<typeof formSchema>) => {
        setError(null);
        authClient.signUp.email(
            {
                name: data.name,
                email: data.email,
                password: data.password,
                callbackURL: "/",
            },
            {
                onRequest: () => setPending(true),
                onSuccess: () => router.push("/"),
                onError: ({ error: { message } }) => {
                    setError(message);
                    setPending(false);
                },
            }
        );
    };

    /** Create form controller */
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    return (
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    {/** Sign up form */}
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSignup)}
                            className="p-6 md:p-8"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center text-center">
                                    <h1 className="text-2xl font-bold">
                                        Let&apos;s get started!
                                    </h1>
                                    <p className="text-muted-foreground text-balance">
                                        Create your account
                                    </p>
                                </div>
                                {/** Name input */}
                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Your name"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
                                {/** Confirm password input */}
                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Confirm Password
                                                </FormLabel>
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
                                            Signing up
                                        </>
                                    ) : (
                                        <>
                                            <FaUserPlus />
                                            Sign up
                                        </>
                                    )}
                                </Button>
                                {/** Sign up with socials */}
                                <SocialsAuthentication
                                    {...{ pending, setPending, setError }}
                                />
                                {/** Sign in */}
                                <div className="text-center text-sm">
                                    Already have an account?{" "}
                                    <Link
                                        href="/sign-in"
                                        className="underline underline-offset-4"
                                    >
                                        Sign in
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                    {/** Right panel (included logo and some introduction text) */}
                    <RightPanel />
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
