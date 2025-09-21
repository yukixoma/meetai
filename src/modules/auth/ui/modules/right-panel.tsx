import { cn } from "@/lib/utils";
import { Bitcount_Single } from "next/font/google";

import Image from "next/image";

const bitcountSingle = Bitcount_Single({
    subsets: ["latin"],
});

export const RightPanel = () => {
    return (
        <div className="bg-radial from-sidebar-accent to-sidebar relative hidden md:flex flex-col gap-y-4 items-center justify-center">
            <Image
                src="/logo.svg"
                alt="Logo image"
                height={92}
                width={92}
                className="h-[92px] w-[92px] animate-ping"
            />
            <p
                className={cn(
                    "text-2xl font-semibold text-white",
                    bitcountSingle.className
                )}
            >
                Meet.AI
            </p>
        </div>
    );
};
