import { Suspense } from "react";

import { getQueryClient, trpc } from "@/trpc/server";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ErrorBoundary } from "react-error-boundary";

import {
    AgentIdView,
    AgentIdViewErrorState,
    AgentIdViewLoadingState,
} from "@/modules/agents/ui/views/agent-id-view";

interface Props {
    params: Promise<{ agentId: string }>;
}

const Page = async ({ params }: Props) => {
    const { agentId } = await params;

    const queryClient = getQueryClient();
    await queryClient.prefetchQuery(
        trpc.agents.getOne.queryOptions({ id: agentId })
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<AgentIdViewLoadingState />}>
                <ErrorBoundary fallback={<AgentIdViewErrorState />}>
                    <AgentIdView {...{ agentId }} />
                </ErrorBoundary>
            </Suspense>
        </HydrationBoundary>
    );
};

export default Page;
