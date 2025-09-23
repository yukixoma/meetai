import { createAvatar } from "@dicebear/core";
import { botttsNeutral, initials } from "@dicebear/collection";

export const generateAvatarUri = ({
    seed,
    variant,
}: {
    seed: string;
    variant: "botttsNeutral" | "initials";
}) => {
    if (variant === "botttsNeutral") {
        return createAvatar(botttsNeutral, { seed }).toDataUri();
    }

    return createAvatar(initials, {
        seed,
        fontWeight: 500,
        fontSize: 42,
    }).toDataUri();
};
