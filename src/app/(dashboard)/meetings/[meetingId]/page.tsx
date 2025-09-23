import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "@/trpc/server";

import { ErrorBoundary } from "react-error-boundary";

import { authenticator } from "@/components/authenticator";

import {
    MeetingIdView,
    MeetingIdViewErrorState,
    MeetingIdViewLoadingState,
} from "@/modules/meetings/ui/views/meeting-id-view";

const Page = async ({ params }: { params: Promise<{ meetingId: string }> }) => {
    /** Security checking */
    await authenticator();

    const { meetingId } = await params;
    prefetch(trpc.meetings.getOne.queryOptions({ id: meetingId }));
    //TOD: prefetch get transcript "meeting.getTranscript"

    return (
        <HydrateClient>
            <Suspense fallback={<MeetingIdViewLoadingState />}>
                <ErrorBoundary fallback={<MeetingIdViewErrorState />}>
                    <MeetingIdView {...{ meetingId }} />
                </ErrorBoundary>
            </Suspense>
        </HydrateClient>
    );
};

export default Page;
