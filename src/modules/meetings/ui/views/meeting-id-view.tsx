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

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";

import { MeetingIdHeader } from "../components/meeting-id-header";
import { useConfirm } from "@/hooks/use-confirm";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";

export const MeetingIdView = ({ meetingId }: { meetingId: string }) => {
    const router = useRouter();
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(
        trpc.meetings.getOne.queryOptions({ id: meetingId })
    );
    const queryClient = useQueryClient();

    const [RemoveConfirmation, confirmRemove] = useConfirm({
        title: "Are you sure?",
        description: "The following action will remove this meeting",
    });

    const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] =
        useState(false);

    const removeMeeting = useMutation(
        trpc.meetings.remove.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(
                    trpc.meetings.getMany.queryOptions({})
                );
                // TODO: Invalidate free tier usage

                router.replace("/meetings");
            },
            onError: ({ message }) => {
                toast.error(message);
            },
        })
    );

    const handleRemoveMeeting = async () => {
        const isOk = await confirmRemove();

        if (!isOk) return;

        await removeMeeting.mutateAsync({ id: meetingId });
    };

    return (
        <>
            <RemoveConfirmation />
            <UpdateMeetingDialog
                open={updateMeetingDialogOpen}
                onOpenChange={setUpdateMeetingDialogOpen}
                initialValues={data}
            />
            <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
                <MeetingIdHeader
                    {...{ meetingId, meetingName: data.name }}
                    onEdit={() => setUpdateMeetingDialogOpen(true)}
                    onRemove={handleRemoveMeeting}
                />
            </div>
        </>
    );
};

export const MeetingIdViewLoadingState = () => (
    <LoadingState
        title="Loading Meeting"
        description="This may take a few seconds"
    />
);

export const MeetingIdViewErrorState = () => (
    <ErrorState
        title="Error Loading Meeting"
        description="Please try again later"
    />
);
