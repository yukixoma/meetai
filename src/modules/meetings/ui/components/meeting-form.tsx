"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";

import { MeetingGetOne } from "../../types";
import { meetingsInsertSchema } from "../../schemas";
import { useState } from "react";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";
import { LoaderIcon } from "lucide-react";

interface MeetingFormProps {
    onSuccess?: (id?: string) => void;
    onCancel?: () => void;
    initialValues?: MeetingGetOne;
}

export const MeetingForm = ({
    onSuccess,
    onCancel,
    initialValues,
}: MeetingFormProps) => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false);
    const [agentsSearch, setAgentsSearch] = useState("");

    const agents = useQuery(
        trpc.agents.getMany.queryOptions({
            pageSize: 100,
            search: agentsSearch,
        })
    );

    const createMeeting = useMutation(
        trpc.meetings.create.mutationOptions({
            onSuccess: async (data) => {
                await queryClient.invalidateQueries(
                    trpc.meetings.getMany.queryOptions({})
                );

                //TODO: Invalidate free tier usage
                onSuccess?.(data.id);
            },
            onError: ({ message }) => {
                toast.error(message);

                // TODO: Check if error code is "FORBIDDEN", redirect to "/upgrade"
            },
        })
    );

    const updateMeeting = useMutation(
        trpc.meetings.update.mutationOptions({
            onSuccess: async () => {
                await queryClient.invalidateQueries(
                    trpc.meetings.getMany.queryOptions({})
                );

                if (initialValues?.id) {
                    await queryClient.invalidateQueries(
                        trpc.meetings.getOne.queryOptions({
                            id: initialValues.id,
                        })
                    );
                }

                onSuccess?.();
            },
            onError: ({ message }) => {
                toast.error(message);

                // TODO: Check if error code is "FORBIDDEN", redirect to "/upgrade"
            },
        })
    );

    const isEdit = !!initialValues?.id;
    const isPending = createMeeting.isPending || updateMeeting.isPending;

    const form = useForm<z.infer<typeof meetingsInsertSchema>>({
        resolver: zodResolver(meetingsInsertSchema),
        defaultValues: {
            name: initialValues?.name ?? "",
            agentId: initialValues?.agentId ?? "",
        },
    });

    const onSubmit = (values: z.infer<typeof meetingsInsertSchema>) => {
        if (isEdit) {
            updateMeeting.mutate({ ...values, id: initialValues.id });
        } else {
            createMeeting.mutate(values);
        }
    };

    return (
        <>
            <NewAgentDialog
                open={openNewAgentDialog}
                onOpenChange={setOpenNewAgentDialog}
            />
            <Form {...form}>
                <form
                    className="space-y-4"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <FormField
                        name="name"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="e.g. Math consultations"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="agentId"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Agent</FormLabel>
                                <FormControl>
                                    <CommandSelect
                                        options={(agents.data?.items || []).map(
                                            (agent) => ({
                                                id: agent.id,
                                                value: agent.id,
                                                children: (
                                                    <div className="flex items-center gap-x-2">
                                                        <GeneratedAvatar
                                                            seed={agent.name}
                                                            variant="botttsNeutral"
                                                        />
                                                        <span>
                                                            {agent.name}
                                                        </span>
                                                    </div>
                                                ),
                                            })
                                        )}
                                        onSelect={field.onChange}
                                        onSearch={setAgentsSearch}
                                        value={field.value}
                                        placeholder="Select an agent"
                                    />
                                </FormControl>
                                <FormDescription>
                                    Not found what you are looking for?{" "}
                                    <button
                                        type="button"
                                        className="text-primary hover:underline"
                                        onClick={() =>
                                            setOpenNewAgentDialog(true)
                                        }
                                    >
                                        Create new agent
                                    </button>
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-between gap-x-2">
                        {onCancel && (
                            <Button
                                variant="ghost"
                                disabled={isPending}
                                type="button"
                                onClick={() => onCancel()}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button disabled={isPending} type="submit">
                            {isPending && (
                                <LoaderIcon className="animate-spin" />
                            )}
                            {isEdit ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    );
};
