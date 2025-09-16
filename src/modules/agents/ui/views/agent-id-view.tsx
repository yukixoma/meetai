"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from "@tanstack/react-query";

import { VideoIcon } from "lucide-react";

import { useConfirm } from "@/hooks/use-confirm";

import { GeneratedAvatar } from "@/components/generated-avatar";

import { Badge } from "@/components/ui/badge";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { AgentIdHeader } from "../components/agent-id-header";
import { UpdateAgentDialog } from "../components/update-agent-dialog";

export const AgentIdView = ({ agentId }: { agentId: string }) => {
    const router = useRouter();

    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const { data } = useSuspenseQuery(
        trpc.agents.getOne.queryOptions({ id: agentId })
    );

    const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);

    const removeAgent = useMutation(
        trpc.agents.remove.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(
                    trpc.agents.getMany.queryOptions({})
                );
                // TODO: Invalidate free tier usage
                router.push("/agents");
            },
            onError: ({ message }) => {
                toast.error(message);
            },
        })
    );

    const [RemoveConfirmation, confirmRemove] = useConfirm({
        title: "Are you sure?",
        description: `The following action will remove ${data.meetingCount} associated meetings`,
    });

    const handleRemoveAgent = async () => {
        const isOk = await confirmRemove();

        if (!isOk) return;
        await removeAgent.mutateAsync({ id: agentId });
    };

    return (
        <>
            <RemoveConfirmation />
            <UpdateAgentDialog
                open={updateAgentDialogOpen}
                onOpenChange={setUpdateAgentDialogOpen}
                initialValues={data}
            />
            <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
                <AgentIdHeader
                    agentId={agentId}
                    agentName={data.name}
                    onEdit={() => setUpdateAgentDialogOpen(true)}
                    onRemove={handleRemoveAgent}
                />
                <div className="bg-white rounded-lg border">
                    <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
                        <div className="flex items-center gap-x-3">
                            <GeneratedAvatar
                                variant="botttsNeutral"
                                seed={data.name}
                                className="size-10"
                            />
                            <h2 className="text-2xl font-medium">
                                {data.name}
                            </h2>
                        </div>
                        <Badge
                            variant="outline"
                            className="flex items-center gap-x-2 [&>svg]:size-4"
                        >
                            <VideoIcon className="text-blue-700" />
                            {data.meetingCount}{" "}
                            {data.meetingCount === 1 ? "meeting" : "meetings"}
                        </Badge>
                        <div className="flex flex-col gap-y-4">
                            <p className="text-lg font-medium">Instructions</p>
                            <p className="text-neutral-800">
                                {data.instructions}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export const AgentIdViewLoadingState = () => (
    <LoadingState
        title="Loading Agent"
        description="This may take a few seconds"
    />
);

export const AgentIdViewErrorState = () => (
    <ErrorState
        title="Error Loading Agent"
        description="Please try again later"
    />
);
