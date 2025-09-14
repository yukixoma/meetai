"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { Plus, XCircleIcon } from "lucide-react";

import { NewAgentDialog } from "./new-agent-dialog";
import { AgentsSearchFilter } from "./agents-search-filter";
import { useAgentsFilters } from "../../hooks/use-agents-filters";

import { DEFAULT_PAGE } from "@/constants";

export const AgentsListHeader = () => {
    const [filters, setFilters] = useAgentsFilters();
    const [isDialogOpen, setDialogOpen] = useState(false);

    const isAnyFilterModified = !!filters.search;

    const onClearFilters = () => {
        setFilters({
            search: "",
            page: DEFAULT_PAGE,
        });
    };

    return (
        <>
            <NewAgentDialog open={isDialogOpen} onOpenChange={setDialogOpen} />
            <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                    <h5 className="font-medium text-xl">My Agents</h5>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus />
                        New Agent
                    </Button>
                </div>
                <div className="flex items-center gap-x-2 p-1">
                    <AgentsSearchFilter />
                    {isAnyFilterModified && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearFilters}
                        >
                            <XCircleIcon />
                            Clear
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
};
