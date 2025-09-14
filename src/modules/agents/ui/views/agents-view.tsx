"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";

import { DataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { EmptyState } from "@/components/empty-state";

export const AgentsView = () => {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.agents.getMany.queryOptions());

    return (
        <div className="flex-1 pb-4 px-4 md:px-8 flx flex-col gap-y-4">
            <DataTable {...{ data, columns }} />
            {data.length === 0 && (
                <EmptyState
                    title="Create your first Agent"
                    description="Create an agent to join your meetings. 
                    Each agent will follow your instructions and can interact with participants during the call."
                />
            )}
        </div>
    );
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
