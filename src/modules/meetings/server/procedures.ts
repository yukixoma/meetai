import {
    and,
    desc,
    eq,
    getTableColumns,
    ilike,
    inArray,
    sql,
} from "drizzle-orm";

import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

import { z } from "zod";

import {
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    MIN_PAGE_SIZE,
} from "@/constants";

import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
import { MeetingStatus, StreamTranscriptItem } from "../types";

import { streamVideo } from "@/lib/stream-video";

import { generateAvatarUri } from "@/lib/avatar";

import JSONL from "jsonl-parse-stringify";
import { streamChat } from "@/lib/stream-chat";

export const meetingsRouter = createTRPCRouter({
    create: protectedProcedure
        .input(meetingsInsertSchema)
        .mutation(async ({ input, ctx }) => {
            const [createdMeeting] = await db
                .insert(meetings)
                .values({ ...input, userId: ctx.auth.user.id })
                .returning();

            // TODO: Create Stream Call, Upsert Stream Users
            const call = streamVideo.video.call("default", createdMeeting.id);
            await call.create({
                data: {
                    created_by_id: ctx.auth.user.id,
                    custom: {
                        meetingId: createdMeeting.id,
                        meetingName: createdMeeting.name,
                    },
                    settings_override: {
                        transcription: {
                            language: "en",
                            mode: "auto-on",
                            closed_caption_mode: "auto-on",
                        },
                        recording: {
                            mode: "auto-on",
                            quality: "1080p",
                        },
                    },
                },
            });

            const [existingAgent] = await db
                .select()
                .from(agents)
                .where(
                    and(
                        eq(agents.id, createdMeeting.agentId),
                        eq(agents.userId, ctx.auth.user.id)
                    )
                );

            if (!existingAgent) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Agent not found",
                });
            }

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

            return createdMeeting;
        }),

    getOne: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input, ctx }) => {
            const [existingMeeting] = await db
                .select({
                    ...getTableColumns(meetings),
                    agent: agents,
                    duration:
                        sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
                            "duration"
                        ),
                })
                .from(meetings)
                .innerJoin(agents, eq(meetings.agentId, agents.id))
                .where(
                    and(
                        eq(meetings.id, input.id),
                        eq(meetings.userId, ctx.auth.user.id)
                    )
                );

            if (!existingMeeting) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Meeting not found",
                });
            }

            return existingMeeting;
        }),

    getMany: protectedProcedure
        .input(
            z.object({
                page: z.number().default(DEFAULT_PAGE),
                pageSize: z
                    .number()
                    .min(MIN_PAGE_SIZE)
                    .max(MAX_PAGE_SIZE)
                    .default(DEFAULT_PAGE_SIZE),
                search: z.string().nullish(),
                agentId: z.string().nullish(),
                status: z.enum(...[MeetingStatus]).nullish(),
            })
        )
        .query(
            async ({
                input: { page, pageSize, search, agentId, status },
                ctx,
            }) => {
                const items = await db
                    .select({
                        ...getTableColumns(meetings),
                        agent: agents,
                        duration:
                            sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
                                "duration"
                            ),
                    })
                    .from(meetings)
                    .innerJoin(agents, eq(meetings.agentId, agents.id))
                    .where(
                        and(
                            eq(meetings.userId, ctx.auth.user.id),
                            search
                                ? ilike(meetings.name, `%${search}%`)
                                : undefined,
                            status ? eq(meetings.status, status) : undefined,
                            agentId ? eq(meetings.agentId, agentId) : undefined
                        )
                    )
                    .orderBy(desc(meetings.createdAt), desc(meetings.id))
                    .limit(pageSize)
                    .offset((page - 1) * pageSize);

                const total = await db.$count(
                    meetings,
                    and(
                        eq(meetings.userId, ctx.auth.user.id),
                        search
                            ? ilike(meetings.name, `%${search}%`)
                            : undefined,
                        status ? eq(meetings.status, status) : undefined,
                        agentId ? eq(meetings.agentId, agentId) : undefined
                    )
                );

                const totalPages = Math.ceil(total / pageSize);

                return { items, total, totalPages };
            }
        ),

    update: protectedProcedure
        .input(meetingsUpdateSchema)
        .mutation(async ({ input, ctx }) => {
            /** Check if agent belongs to logged-in user */
            if (!!input.agentId) {
                const [agent] = await db
                    .select({ agentId: agents.id })
                    .from(agents)
                    .where(
                        and(
                            eq(agents.id, input.agentId),
                            eq(agents.userId, ctx.auth.user.id)
                        )
                    );

                if (!agent) {
                    throw new TRPCError({
                        code: "UNAUTHORIZED",
                        message: "Selected agent does not belong to this user",
                    });
                }
            }

            const [updatedMeeting] = await db
                .update(meetings)
                .set(input)
                .where(
                    and(
                        eq(meetings.id, input.id),
                        eq(meetings.userId, ctx.auth.user.id)
                    )
                )
                .returning();

            if (!updatedMeeting) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Meeting not found",
                });
            }

            return updatedMeeting;
        }),

    remove: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const [removedMeeting] = await db
                .delete(meetings)
                .where(
                    and(
                        eq(meetings.id, input.id),
                        eq(meetings.userId, ctx.auth.user.id)
                    )
                )
                .returning();

            if (!removedMeeting) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Meeting not found",
                });
            }

            return removedMeeting;
        }),

    generateToken: protectedProcedure.mutation(async ({ ctx }) => {
        const { id, name, image } = ctx.auth.user;

        await streamVideo.upsertUsers([
            {
                id,
                name,
                role: "admin",
                image:
                    image ??
                    generateAvatarUri({
                        seed: name,
                        variant: "initials",
                    }),
            },
        ]);

        const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        const issuedAt = Math.floor(Date.now() / 1000) - 60;

        const token = streamVideo.generateUserToken({
            user_id: id,
            exp: expirationTime,
            validity_in_seconds: issuedAt,
        });

        return token;
    }),

    generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
        const token = streamChat.createToken(ctx.auth.user.id);
        await streamChat.upsertUser({ id: ctx.auth.user.id, role: "admin" });

        return token;
    }),

    getTranscript: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input: { id }, ctx }) => {
            const [existingMeeting] = await db
                .select()
                .from(meetings)
                .where(
                    and(
                        eq(meetings.id, id),
                        eq(meetings.userId, ctx.auth.user.id)
                    )
                );

            if (!meetings) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Meeting not found",
                });
            }

            if (!existingMeeting.transcriptUrl) {
                return [];
            }

            const transcript = await fetch(existingMeeting.transcriptUrl)
                .then((res) => res.text())
                .then((text) => JSONL.parse<StreamTranscriptItem>(text))
                .catch(() => []);

            const speakerIds = [
                ...new Set(transcript.map((item) => item.speaker_id)),
            ];

            const userSpeakers = await db
                .select()
                .from(user)
                .where(inArray(user.id, speakerIds))
                .then((users) =>
                    users.map((user) => ({
                        ...user,
                        image:
                            user.image ??
                            generateAvatarUri({
                                seed: user.name,
                                variant: "initials",
                            }),
                    }))
                );

            const agentSpeakers = await db
                .select()
                .from(agents)
                .where(inArray(agents.id, speakerIds))
                .then((agents) =>
                    agents.map((agent) => ({
                        ...agent,
                        image: generateAvatarUri({
                            seed: agent.name,
                            variant: "botttsNeutral",
                        }),
                    }))
                );

            const speakers = [...userSpeakers, ...agentSpeakers];
            const transcriptWithSpeakers = transcript.map((item) => {
                const speaker = speakers.find(
                    (speaker) => speaker.id === item.speaker_id
                );

                if (!speaker) {
                    return {
                        ...item,
                        user: {
                            name: "Unknown",
                            image: generateAvatarUri({
                                seed: "Unknown",
                                variant: "initials",
                            }),
                        },
                    };
                }

                return {
                    ...item,
                    user: {
                        name: speaker.name,
                        image: speaker.image,
                    },
                };
            });

            return transcriptWithSpeakers;
        }),
});
