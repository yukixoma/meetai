import { Suspense } from "react";

import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import {
    AgentsView,
    AgentsViewErrorState,
    AgentsViewLoadingState,
} from "@/modules/agents/ui/views/agents-view";

import { ErrorBoundary } from "react-error-boundary";

const Page = async () => {
    const queryClient = getQueryClient();
    queryClient.prefetchQuery(trpc.agents.getMany.queryOptions());

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<AgentsViewLoadingState />}>
                <ErrorBoundary fallback={<AgentsViewErrorState />}>
                    <AgentsView />
                </ErrorBoundary>
            </Suspense>
        </HydrationBoundary>
    );
};

export default Page;
