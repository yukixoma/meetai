"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

import { GeneratedAvatar } from "@/components/generated-avatar";

import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from "lucide-react";

export const DashboardUserButton = () => {
    const router = useRouter();
    const isMobile = useIsMobile();
    const { data, isPending } = authClient.useSession();

    const onSignout = () => {
        authClient.signOut({
            fetchOptions: {
                onSuccess: () => router.push("/sign-in"),
            },
        });
    };

    if (isPending || !data?.user) {
        return null;
    }

    if (isMobile) {
        return (
            <Drawer>
                <DrawerTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2">
                    <Trigger {...data.user} />
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{data.user.name}</DrawerTitle>
                        <DrawerDescription>{data.user.email}</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                        <Button variant="outline" onClick={() => {}}>
                            <CreditCardIcon className="size-4 text-black" />
                            Billing
                        </Button>
                        <Button variant="outline" onClick={onSignout}>
                            <LogOutIcon className="size-4 text-black" />
                            Sign out
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2">
                <Trigger {...data.user} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-72">
                <DropdownMenuLabel className="flex flex-col gap-1 ">
                    <span className="font-medium truncate">
                        {data.user.name}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground truncate">
                        {data.user.email}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer flex items-center justify-between">
                    Billing
                    <CreditCardIcon className="size-4" />
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="cursor-pointer flex items-center justify-between"
                    onClick={onSignout}
                >
                    Sign out
                    <LogOutIcon className="size-4" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

interface TriggerProps {
    image?: string | null;
    name: string;
    email: string;
}

const Trigger = ({ image, name, email }: TriggerProps) => {
    return (
        <>
            {/** Display avatar */}
            {image ? (
                <Avatar>
                    <AvatarImage src={image} />
                </Avatar>
            ) : (
                <GeneratedAvatar
                    seed={name}
                    variant="initials"
                    className="size-9 mr-3"
                />
            )}
            <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
                <p className="text-sm truncate w-full">{name}</p>
                <p className="text-xs truncate w-full">{email}</p>
            </div>
            <ChevronDownIcon className="size-4 shrink-0" />
        </>
    );
};
