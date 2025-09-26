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
} from "@stream-io/node-sdk";

import { inngest } from "@/inngest/client";

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
