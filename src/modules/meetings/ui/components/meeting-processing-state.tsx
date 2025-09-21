import { EmptyState } from "@/components/empty-state";

export const MeetingProcessingState = () => {
    return (
        <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
            <EmptyState
                title="Meeting completed"
                description="This meeting was completed, a summary will appear soon"
                image="/processing.svg"
            />
        </div>
    );
};
