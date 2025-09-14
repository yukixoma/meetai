import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

import { DEFAULT_PAGE } from "@/constants";

/**
 * 2 ways biding search input and url
 * Search params for client side
 */
export const useAgentsFilters = () => {
    return useQueryStates({
        search: parseAsString
            .withDefault("")
            .withOptions({ clearOnDefault: true }),
        page: parseAsInteger
            .withDefault(DEFAULT_PAGE)
            .withOptions({ clearOnDefault: true }),
    });
};
