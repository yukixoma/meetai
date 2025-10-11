import { NextRequest, NextResponse } from "next/server";

import { and, eq, not } from "drizzle-orm";

import { agents, meetings } from "@/db/schema";
import { db } from "@/db";

import { streamVideo } from "@/lib/stream-video";
import {
    CallEndedEvent,
    CallRecordingReadyEvent,
    CallSessionParticipantLeftEvent,
    CallSessionStartedEvent,
    CallTranscriptionReadyEvent,
    MessageNewEvent,
} from "@stream-io/node-sdk";

import { inngest } from "@/inngest/client";
import { streamChat } from "@/lib/stream-chat";

import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { openAIClient } from "@/lib/open-ai";
import { role } from "@stream-io/video-react-sdk";
import { generateAvatarUri } from "@/lib/avatar";

const vefifySignatureWithSDK = (body: string, signature: string): boolean => {
    return streamVideo.verifyWebhook(body, signature);
};

export const POST = async (req: NextRequest) => {
    const signature = req.headers.get("x-signature");
    const apiKey = req.headers.get("x-api-key");

    if (!signature || !apiKey) {
        return NextResponse.json(
            { error: "Missing signature or API key" },
            { status: 400 }
        );
    }

    const body = await req.text();

    if (!vefifySignatureWithSDK(body, signature)) {
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 }
        );
    }

    let payload: unknown;
    try {
        payload = JSON.parse(body) as Record<string, unknown>;
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = (payload as Record<string, unknown>)?.type;

    let result: { error?: string; status?: number } = {
        error: undefined,
        status: undefined,
    };
    switch (eventType) {
        case "call.session_started":
            result = await eventSessionStartedHandler(payload);
            break;
        case "call.session_participant_left":
            result = await eventSessionParticipantLeftHandler(payload);
            break;
        case "call.session_ended":
            result = await eventSessionEndedHandler(payload);
            break;
        case "call.transcription_ready":
            result = await eventTranscriptionReadyHandler(payload);
            break;
        case "call.recording_ready":
            await eventRecordingReadyHandler(payload);
            break;
        case "message.new":
            await eventMessageNewHandler(payload);
            break;
        default:
            break;
    }
    if (result.error) {
        return NextResponse.json(
            { error: result.error },
            { status: result.status }
        );
    }

    return NextResponse.json({ status: "ok" });
};

const eventSessionStartedHandler = async (
    payload: unknown
): Promise<{ error?: string; status?: number }> => {
    console.log("call started");
    const event = payload as CallSessionStartedEvent;

    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
        return Promise.resolve({ error: "Missing meetingId", status: 400 });
    }

    const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
            and(
                eq(meetings.id, meetingId),
                not(eq(meetings.status, "completed")),
                not(eq(meetings.status, "active")),
                not(eq(meetings.status, "cancelled")),
                not(eq(meetings.status, "processing"))
            )
        );

    if (!existingMeeting) {
        return Promise.resolve({ error: "Meeting not found", status: 404 });
    }

    await db
        .update(meetings)
        .set({
            status: "active",
            startedAt: new Date(),
        })
        .where(eq(meetings.id, existingMeeting.id));

    const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
        return Promise.resolve({ error: "Agent not found", status: 404 });
    }

    const call = streamVideo.video.call("default", meetingId);
    const realtimeClient = await streamVideo.video.connectOpenAi({
        call,
        openAiApiKey: process.env.OPENAI_API_KEY!,
        agentUserId: existingAgent.id,
    });

    realtimeClient.updateSession({
        instructions: existingAgent.instructions,
    });

    return Promise.resolve({ error: undefined, status: undefined });
};

const eventSessionParticipantLeftHandler = async (
    payload: unknown
): Promise<{ error?: string; status?: number }> => {
    const event = payload as CallSessionParticipantLeftEvent;
    // call_id is formatted as "type:id"
    const meetingId = event.call_cid.split(":")[1];

    if (!meetingId) {
        return Promise.resolve({ error: "Missing meetingId", status: 400 });
    }

    const call = streamVideo.video.call("default", meetingId);
    await call.end();

    return Promise.resolve({ error: undefined, status: undefined });
};

const eventSessionEndedHandler = async (
    payload: unknown
): Promise<{ error?: string; status?: number }> => {
    const event = payload as CallEndedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
        return Promise.resolve({ error: "Missing meetingId", status: 400 });
    }

    await db
        .update(meetings)
        .set({
            status: "processing",
            endedAt: new Date(),
        })
        .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));

    return Promise.resolve({ error: undefined, status: undefined });
};

const eventTranscriptionReadyHandler = async (
    payload: unknown
): Promise<{ error?: string; status?: number }> => {
    const event = payload as CallTranscriptionReadyEvent;
    const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"

    const [updatedMeeting] = await db
        .update(meetings)
        .set({
            transcriptUrl: event.call_transcription.url,
        })
        .where(eq(meetings.id, meetingId))
        .returning();

    if (!updatedMeeting) {
        return Promise.resolve({ error: "Meeting not found", status: 400 });
    }

    await inngest.send({
        name: "meetings/processing",
        data: {
            meetingId: updatedMeeting.id,
            transcriptUrl: updatedMeeting.transcriptUrl,
        },
    });

    return Promise.resolve({ error: undefined, status: undefined });
};

const eventRecordingReadyHandler = async (payload: unknown) => {
    const event = payload as CallRecordingReadyEvent;
    const meetingId = event.call_cid.split(":")[1]; // call_cid is formatted as "type:id"

    await db
        .update(meetings)
        .set({
            recordingUrl: event.call_recording.url,
        })
        .where(eq(meetings.id, meetingId));
};

const eventMessageNewHandler = async (
    payload: unknown
): Promise<{ error?: string; status?: number }> => {
    const event = payload as MessageNewEvent;
    const userId = event.user?.id;
    const channelId = event.channel_id;
    const text = event.message?.text;

    if (!userId || !channelId || !text) {
        return Promise.resolve({
            error: "Missing required fields",
            status: 400,
        });
    }

    const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
            and(eq(meetings.id, channelId), eq(meetings.status, "completed"))
        );

    if (!existingMeeting) {
        return Promise.resolve({
            error: "Meeting not found",
            status: 404,
        });
    }

    const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
        return Promise.resolve({
            error: "Agent not found",
            status: 404,
        });
    }

    if (userId !== existingAgent.userId) {
        const instructions = `
            You are an AI assistant helping the user revisit a recently completed meeting.
            Below is a summary of the meeting, generated from the transcript:
            
            ${existingMeeting.summary}
            
            The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
            
            ${existingAgent.instructions}
            
            The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
            Always base your responses on the meeting summary above.
            
            You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.
            
            If the summary does not contain enough information to answer a question, politely let the user know.
            
            Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
        `;

        const channel = streamChat.channel("messaging", channelId);
        await channel.watch();
        const previousMessages = channel.state.messages
            .slice(-5)
            .filter((msg) => msg.text && msg.text.trim() !== "")
            .map<ChatCompletionMessageParam>((message) => ({
                role:
                    message.user?.id === existingAgent.id
                        ? "assistant"
                        : "user",
                content: message.text || "",
            }));

        const GPTResponse = await openAIClient.chat.completions.create({
            messages: [
                { role: "system", content: instructions },
                ...previousMessages,
                { role: "user", content: text },
            ],
            model: "gemma3:4b-it-qat",
        });

        const GPTResponseText = GPTResponse.choices[0].message.content;
        if (!GPTResponseText) {
            return Promise.resolve({
                error: "No response from GPT",
                status: 400,
            });
        }

        const agent = {
            id: existingAgent.id,
            name: existingAgent.name,
            image: generateAvatarUri({
                seed: existingAgent.name,
                variant: "botttsNeutral",
            }),
        };

        streamChat.upsertUser(agent);

        channel.sendMessage({
            text: GPTResponseText,
            user: agent,
        });
    }

    return Promise.resolve({ error: undefined, status: undefined });
};
