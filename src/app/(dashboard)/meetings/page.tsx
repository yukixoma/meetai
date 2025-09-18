import { Suspense } from "react";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { getQueryClient, trpc } from "@/trpc/server";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ErrorBoundary } from "react-error-boundary";

import {
    MeetingsView,
    MeetingsViewErrorState,
    MeetingsViewLoadingState,
} from "@/modules/meetings/ui/views/meetings-view";
import { MeetingsListHeader } from "@/modules/meetings/ui/components/meetings-list-header";

const Page = async () => {
    /** Security checking */
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const queryClient = getQueryClient();
    await queryClient.prefetchQuery(trpc.meetings.getMany.queryOptions({}));

    return (
        <>
            <MeetingsListHeader />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<MeetingsViewLoadingState />}>
                    <ErrorBoundary fallback={<MeetingsViewErrorState />}>
                        <MeetingsView />
                    </ErrorBoundary>
                </Suspense>
            </HydrationBoundary>
        </>
    );
};

export default Page;
