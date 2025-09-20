import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import type { SearchParams } from "nuqs";
import { loadSearchParams } from "@/modules/agents/params";

import {
    AgentsView,
    AgentsViewErrorState,
    AgentsViewLoadingState,
} from "@/modules/agents/ui/views/agents-view";

import { AgentsListHeader } from "@/modules/agents/ui/components/agents-list-header";
import { authenticator } from "@/components/authenticator";

interface AgentsPageProps {
    searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: AgentsPageProps) => {
    /** Security checking */
    await authenticator();

    /** Sync client and server initial query */
    const params = await loadSearchParams(searchParams);

    /** Pre-fetch data at server */
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery(
        trpc.agents.getMany.queryOptions({
            ...params,
        })
    );

    return (
        <>
            <AgentsListHeader />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<AgentsViewLoadingState />}>
                    <ErrorBoundary fallback={<AgentsViewErrorState />}>
                        <AgentsView />
                    </ErrorBoundary>
                </Suspense>
            </HydrationBoundary>
        </>
    );
};

export default Page;
