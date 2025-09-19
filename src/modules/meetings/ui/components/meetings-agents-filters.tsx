"use client";

import { useState } from "react";

import { useTRPC } from "@/trpc/client";

import { useQuery } from "@tanstack/react-query";

import { GeneratedAvatar } from "@/components/generated-avatar";

import { CommandSelect } from "@/components/command-select";

import { useMeetingsFilters } from "../../hooks/use-meetings-filters";

import { DEFAULT_PAGE } from "@/constants";

export const MeetingsAgentsFilters = () => {
    const [filters, setFilters] = useMeetingsFilters();
    const trpc = useTRPC();

    const [agentSearch, setAgentSearch] = useState("");

    const { data } = useQuery(
        trpc.agents.getMany.queryOptions({
            pageSize: 100,
            search: agentSearch,
        })
    );

    return (
        <CommandSelect
            className="h-9"
            placeholder="Agent"
            value={filters.agentId}
            options={(data?.items ?? []).map((agent) => ({
                id: agent.id,
                value: agent.id,
                children: (
                    <div className="flex items-center gap-x-2">
                        <GeneratedAvatar
                            seed={agent.name}
                            variant="botttsNeutral"
                            className="size-4"
                        />
                        {agent.name}
                    </div>
                ),
            }))}
            onSelect={(agentId) => setFilters({ agentId, page: DEFAULT_PAGE })}
            onSearch={setAgentSearch}
            onClear={() => setFilters({ agentId: null, page: DEFAULT_PAGE })}
        />
    );
};
