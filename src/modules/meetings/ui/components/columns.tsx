"use client";

import humanizeDuration from "humanize-duration";

import { ColumnDef } from "@tanstack/react-table";

import { MeetingGetMany } from "../../types";

import { GeneratedAvatar } from "@/components/generated-avatar";

import { Badge } from "@/components/ui/badge";

import {
    CircleCheckIcon,
    CircleXIcon,
    ClockArrowUpIcon,
    ClockFadingIcon,
    CornerDownRightIcon,
    LoaderIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { format } from "date-fns";

const formatDuration = (seconds: number) =>
    humanizeDuration(seconds * 1000, {
        largest: 1,
        round: true,
        units: ["h", "m", "s"],
    });

const statusIconMap = {
    upcoming: <ClockArrowUpIcon className="animate-bounce" />,
    active: <LoaderIcon className="animate-pulse" />,
    completed: <CircleCheckIcon />,
    processing: <LoaderIcon className="animate-spin" />,
    cancelled: <CircleXIcon />,
};

const statusColorMap = {
    upcoming: "bg-amber-500/20 text-amber-800 border-amber-800/5",
    active: "bg-emerald-500/20 text-emerald-800 border-emerald-800/5",
    completed: "bg-sky-500/20 text-sky-800 border-sky-800/5",
    processing: "bg-slate-400/20 text-slate-800 border-slate-800/5",
    cancelled: "bg-rose-500/20 text-rose-800 border-rose-800/5",
};

export const columns: ColumnDef<MeetingGetMany[number]>[] = [
    {
        accessorKey: "name",
        header: "Meeting Name",
        cell: ({ row }) => (
            <div className="flex flex-col gap-y-1">
                <span className="font-semibold capitalize">
                    {row.original.name}
                </span>
                <div className="flex items-center gap-x-2">
                    <div className="flex items-center gap-x-1 ">
                        <CornerDownRightIcon className="size-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground max-w-[200px] truncate capitalize">
                            {row.original.agent.name}
                        </span>
                    </div>
                    <GeneratedAvatar
                        seed={row.original.agent.name}
                        variant="botttsNeutral"
                        className="size-4"
                    />
                    <span className="text-sm text-muted-foreground">
                        {row.original.startedAt
                            ? format(row.original.startedAt, "MMM d")
                            : ""}
                    </span>
                </div>
            </div>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const Icon =
                statusIconMap[
                    row.original.status as keyof typeof statusIconMap
                ];
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        "capitalize [&>svg]:size-4 text-muted-foreground",
                        statusColorMap[
                            row.original.status as keyof typeof statusColorMap
                        ]
                    )}
                >
                    {Icon}
                    {row.original.status}
                </Badge>
            );
        },
    },
    {
        accessorKey: "duration",
        header: "Duration",
        cell: ({ row }) => {
            return (
                <Badge
                    variant="outline"
                    className="capitalize [&>svg]:size-4 flex items-center gap-x-2"
                >
                    <ClockFadingIcon className="text-blue-700" />
                    {row.original.duration
                        ? formatDuration(row.original.duration)
                        : "No duration"}
                </Badge>
            );
        },
    },
];
