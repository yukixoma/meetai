import { Suspense } from "react";

import { getQueryClient, trpc } from "@/trpc/server";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ErrorBoundary } from "react-error-boundary";

import { authenticator } from "@/components/authenticator";

import {
    MeetingIdView,
    MeetingIdViewErrorState,
    MeetingIdViewLoadingState,
} from "@/modules/meetings/ui/views/meeting-id-view";

interface MeetingIdPageProps {
    params: Promise<{ meetingId: string }>;
}

const Page = async ({ params }: MeetingIdPageProps) => {
    /** Security checking */
    await authenticator();

    const { meetingId } = await params;
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery(
        trpc.meetings.getOne.queryOptions({
            id: meetingId,
        })
    );
    //TOD: prefetch get transcript "meeting.getTranscript"

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<MeetingIdViewLoadingState />}>
                <ErrorBoundary fallback={<MeetingIdViewErrorState />}>
                    <MeetingIdView {...{ meetingId }} />
                </ErrorBoundary>
            </Suspense>
        </HydrationBoundary>
    );
};

export default Page;
