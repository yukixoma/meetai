"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { Plus, XIcon } from "lucide-react";

import { NewMeetingDialog } from "./new-meeting-dialog";

import { useMeetingsFilters } from "../../hooks/use-meetings-filters";

import { MeetingsSearchFilter } from "./meetings-search-filter";
import { MeetingsStatusFilters } from "./meetings-status-filters";
import { MeetingsAgentsFilters } from "./meetings-agents-filters";

import { DEFAULT_PAGE } from "@/constants";

export const MeetingsListHeader = () => {
    const [filters, setFilters] = useMeetingsFilters();
    const [isDialogOpen, setDialogOpen] = useState(false);

    const isAnyFilterModified =
        !!filters.search || !!filters.status || !!filters.agentId;

    const onClearFilters = () => {
        setFilters({
            search: null,
            status: null,
            agentId: null,
            page: DEFAULT_PAGE,
        });
    };

    return (
        <>
            <NewMeetingDialog
                open={isDialogOpen}
                onOpenChange={setDialogOpen}
            />
            <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                    <h5 className="font-medium text-xl">My Meetings</h5>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus />
                        New Meeting
                    </Button>
                </div>
                <ScrollArea>
                    <div className="flex items-center gap-x-2 p-1">
                        <MeetingsSearchFilter />
                        <MeetingsStatusFilters />
                        <MeetingsAgentsFilters />
                        {isAnyFilterModified && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={onClearFilters}
                            >
                                <XIcon />
                                Clear
                            </Button>
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </>
    );
};
