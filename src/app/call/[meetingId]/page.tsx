import { authenticator } from "@/components/authenticator";
import { CallView } from "@/modules/call/ui/views/call-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

const Page = async ({ params }: { params: Promise<{ meetingId: string }> }) => {
    /** Security checking */
    await authenticator();

    const { meetingId } = await params;

    prefetch(trpc.meetings.getOne.queryOptions({ id: meetingId }));

    return (
        <HydrateClient>
            <CallView {...{ meetingId }} />
        </HydrateClient>
    );
};

export default Page;
