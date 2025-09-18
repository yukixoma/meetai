"use client";

import { useTRPC } from "@/trpc/client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";

export const MeetingsView = () => {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.meetings.getMany.queryOptions({}));

    return <div>TODO: Data table</div>;
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
