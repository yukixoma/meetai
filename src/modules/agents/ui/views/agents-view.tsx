"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";

import { DataTable } from "../components/data-table";
import { DataPagination } from "../components/data-pagination";
import { columns } from "../components/columns";

import { useAgentsFilters } from "../../hooks/use-agents-filters";

export const AgentsView = () => {
    const [filters, setFilters] = useAgentsFilters();

    const trpc = useTRPC();
    const { data } = useSuspenseQuery(
        trpc.agents.getMany.queryOptions({ ...filters })
    );

    return (
        <div className="flex-1 pb-4 px-4 md:px-8 flx flex-col gap-y-4">
            <DataTable data={data.items} columns={columns} />
            <DataPagination
                page={filters.page}
                totalPages={data.totalPages}
                onPageChange={(page) => setFilters({ page })}
            />
            {data.items.length === 0 && (
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
