"use client";

import { useTRPC } from "@/trpc/client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";

import { columns } from "../components/columns";

export const MeetingsView = () => {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.meetings.getMany.queryOptions({}));

    return (
        <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
            <DataTable {...{ data: data.items, columns }} />
            {data.items.length === 0 && (
                <EmptyState
                    title="Create your first Meeting"
                    description="Schedule a meeting to connect with others. 
                    Each meeting lets you collaborate, share ideas, and interact with participants in real time."
                />
            )}
        </div>
    );
};

export const MeetingsViewLoadingState = () => (
    <LoadingState
        title="Loading Meetings"
        description="This may take a few seconds"
    />
);

export const MeetingsViewErrorState = () => (
    <ErrorState
        title="Error Loading Meetings"
        description="Please try again later"
    />
);
