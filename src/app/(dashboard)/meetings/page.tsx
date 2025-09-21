import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient, prefetch, trpc } from "@/trpc/server";

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
    prefetch(trpc.meetings.getMany.queryOptions({ ...params }));

    return (
        <>
            <MeetingsListHeader />
            <HydrateClient>
                <Suspense fallback={<MeetingsViewLoadingState />}>
                    <ErrorBoundary fallback={<MeetingsViewErrorState />}>
                        <MeetingsView />
                    </ErrorBoundary>
                </Suspense>
            </HydrateClient>
        </>
    );
};

export default Page;
