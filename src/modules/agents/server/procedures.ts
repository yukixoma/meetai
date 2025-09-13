import { db } from "@/db";
import { agents } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const agentsRouter = createTRPCRouter({
    getMany: baseProcedure.query(async () => {
        // await new Promise((res) => setTimeout(res, 5000));
        // throw new TRPCError({ code: "BAD_REQUEST" });
        return await db.select().from(agents);
    }),
});
