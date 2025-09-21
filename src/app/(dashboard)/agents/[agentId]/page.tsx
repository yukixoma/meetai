import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "@/trpc/server";

import { ErrorBoundary } from "react-error-boundary";

import {
    AgentIdView,
    AgentIdViewErrorState,
    AgentIdViewLoadingState,
} from "@/modules/agents/ui/views/agent-id-view";
import { authenticator } from "@/components/authenticator";

interface AgentIdPageProps {
    params: Promise<{ agentId: string }>;
}

const Page = async ({ params }: AgentIdPageProps) => {
    /** Security checking */
    await authenticator();

    const { agentId } = await params;
    prefetch(trpc.agents.getOne.queryOptions({ id: agentId }));

    return (
        <HydrateClient>
            <Suspense fallback={<AgentIdViewLoadingState />}>
                <ErrorBoundary fallback={<AgentIdViewErrorState />}>
                    <AgentIdView {...{ agentId }} />
                </ErrorBoundary>
            </Suspense>
        </HydrateClient>
    );
};

export default Page;
