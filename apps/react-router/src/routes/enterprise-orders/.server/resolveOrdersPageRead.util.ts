import { parseOrdersPageParams } from './parseOrdersPageParams.util';
import { resolveOrdersGroupRead } from './resolveOrdersGroupRead.util';

/**
 * `/paginated`'s search params as the read to run. The modal route's loader
 * skips this half — the table factory has already parsed the page vocabulary —
 * and calls `resolveOrdersGroupRead` directly.
 */
export const resolveOrdersPageRead = async (params: URLSearchParams) =>
  resolveOrdersGroupRead({ ...parseOrdersPageParams(params), params });
