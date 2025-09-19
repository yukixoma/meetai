import { Suspense } from "react";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ErrorBoundary } from "react-error-boundary";

import { auth } from "@/lib/auth";

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

interface AgentsPageProps {
    searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: AgentsPageProps) => {
    /** Security checking */
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    /** Return view if security checking passed*/
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
