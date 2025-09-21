"use client";

import { Bitcount_Single } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { Separator } from "@/components/ui/separator";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

import { BotIcon, StarIcon, VideoIcon } from "lucide-react";

import { DashboardUserButton } from "./dashboard-user-button";

const bitcountSingle = Bitcount_Single({
    subsets: ["latin"],
});

const firstSection = [
    {
        icon: VideoIcon,
        label: "Meetings",
        href: "/meetings",
    },
    {
        icon: BotIcon,
        label: "Agents",
        href: "/agents",
    },
];

const secondSection = [
    {
        icon: StarIcon,
        label: "Upgrade",
        href: "/upgrade",
    },
];

export const DashboardSidebar = () => {
    const pathName = usePathname();

    return (
        <Sidebar>
            {/** Sidebar header */}
            <SidebarHeader className="text-sidebar-accent-foreground">
                <Link href="/" className="flex items-center gap-2 px-2 pt-2">
                    <Image
                        src="/logo.svg"
                        alt="Logo image"
                        height={36}
                        width={36}
                        className="animate-spin"
                    />
                    <p
                        className={cn(
                            "text-2xl font-semibold",
                            bitcountSingle.className
                        )}
                    >
                        Meet.AI
                    </p>
                </Link>
            </SidebarHeader>
            <div className="px-4 py-2">
                <Separator className="opacity-10 text-[#5D6b68]" />
            </div>
            {/** Sidebar contents */}
            <SidebarContent>
                {/** Sidebar first group */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {firstSection.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathName === item.href}
                                        className={cn(
                                            "h-10 hover:bg-linear-to-r/oklch border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                                            pathName === item.href &&
                                                "bg-linear-to-r/oklch border-[#5D6B68]/10"
                                        )}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span className="text-sm font-medium tracking-tight">
                                                {item.label}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <div className="px-4 py-2">
                    <Separator className="opacity-10 text-[#5D6b68]" />
                </div>
                {/** Sidebar second group */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {secondSection.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathName === item.href}
                                        className={cn(
                                            "h-10 hover:bg-linear-to-r/oklch border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                                            pathName === item.href &&
                                                "bg-linear-to-r/oklch border-[#5D6B68]/10"
                                        )}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span className="text-sm font-medium tracking-tight">
                                                {item.label}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="text-white">
                <DashboardUserButton />
            </SidebarFooter>
        </Sidebar>
    );
};
