import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient, prefetch, trpc } from "@/trpc/server";

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
    prefetch(trpc.agents.getMany.queryOptions({ ...params }));

    return (
        <>
            <AgentsListHeader />
            <HydrateClient>
                <Suspense fallback={<AgentsViewLoadingState />}>
                    <ErrorBoundary fallback={<AgentsViewErrorState />}>
                        <AgentsView />
                    </ErrorBoundary>
                </Suspense>
            </HydrateClient>
        </>
    );
};

export default Page;
