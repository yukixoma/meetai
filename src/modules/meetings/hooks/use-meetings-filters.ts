import {
    parseAsInteger,
    parseAsString,
    parseAsStringEnum,
    useQueryStates,
} from "nuqs";

import { DEFAULT_PAGE } from "@/constants";
import { MeetingStatus } from "../types";

/**
 * 2 ways biding search input and url
 * Search params for client side
 */
export const useMeetingsFilters = () => {
    return useQueryStates({
        search: parseAsString
            .withDefault("")
            .withOptions({ clearOnDefault: true }),
        page: parseAsInteger
            .withDefault(DEFAULT_PAGE)
            .withOptions({ clearOnDefault: true }),
        status: parseAsStringEnum(Object.values(MeetingStatus)),
        agentId: parseAsString
            .withDefault("")
            .withOptions({ clearOnDefault: true }),
    });
};
