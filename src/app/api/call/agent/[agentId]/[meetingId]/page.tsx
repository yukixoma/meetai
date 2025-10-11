import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { generateAvatarUri } from "@/lib/avatar";
import { streamVideo } from "@/lib/stream-video";
import { AgentStreamVideo } from "@/modules/agents/api/agent-call";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { and, eq } from "drizzle-orm";

interface agentCallProps {
    agentId: string;
    meetingId: string;
}

const Page = async ({ params }: { params: Promise<agentCallProps> }) => {
    const { agentId, meetingId } = await params;

    const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(and(eq(meetings.id, meetingId), eq(meetings.agentId, agentId)));

    if (!existingMeeting) return <div />;

    const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, agentId));

    if (!existingAgent) return <div />;

    await streamVideo.upsertUsers([
        {
            id: existingAgent.id,
            name: existingAgent.name,
            role: "user",
            image: generateAvatarUri({
                seed: existingAgent.name,
                variant: "botttsNeutral",
            }),
        },
    ]);

    const token = streamVideo.generateUserToken({
        user_id: existingAgent.id,
    });

    prefetch(trpc.agents.getOne.queryOptions({ id: agentId }));

    return (
        <HydrateClient>
            <AgentStreamVideo {...{ token, meetingId, agentId }} />
        </HydrateClient>
    );
};

export default Page;
