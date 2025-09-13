"use client";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const AgentsView = () => {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions());

    return <div>{JSON.stringify(data, null, 2)}</div>;
};

export const AgentsViewLoadingState = () => (
    <LoadingState
        title="Loading Agents"
        description="This may take a few seconds"
    />
);

export const AgentsViewErrorState = () => (
    <ErrorState
        title="Error Loading Agents"
        description="Please try again later"
    />
);
