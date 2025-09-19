import {
    createLoader,
    parseAsInteger,
    parseAsString,
    parseAsStringEnum,
} from "nuqs/server";

import { DEFAULT_PAGE } from "@/constants";
import { MeetingStatus } from "./types";

/** Search params for server side */
export const filterSearchParams = {
    search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    page: parseAsInteger
        .withDefault(DEFAULT_PAGE)
        .withOptions({ clearOnDefault: true }),
    status: parseAsStringEnum(Object.values(MeetingStatus)),
    agentId: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
};

export const loadSearchParams = createLoader(filterSearchParams);
