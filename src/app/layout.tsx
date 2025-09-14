import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { TRPCReactProvider } from "@/trpc/client";

import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Meet.AI",
    description: "Your AI meeting workspace.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} antialiased`}>
                <TRPCReactProvider>
                    <Toaster />
                    {children}
                </TRPCReactProvider>
            </body>
        </html>
    );
}
