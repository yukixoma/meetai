import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { getQueryClient, trpc } from "@/trpc/server";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import type { SearchParams } from "nuqs";
import { loadSearchParams } from "@/modules/meetings/params";

import {
    MeetingsView,
    MeetingsViewErrorState,
    MeetingsViewLoadingState,
} from "@/modules/meetings/ui/views/meetings-view";

import { MeetingsListHeader } from "@/modules/meetings/ui/components/meetings-list-header";

import { authenticator } from "@/components/authenticator";

interface MeetingsPageProps {
    searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: MeetingsPageProps) => {
    /** Security checking */
    await authenticator();

    /** Sync client and server initial query */
    const params = await loadSearchParams(searchParams);

    /** Pre-fetch data at server */
    const queryClient = getQueryClient();
    await queryClient.prefetchQuery(
        trpc.meetings.getMany.queryOptions({
            ...params,
        })
    );

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
