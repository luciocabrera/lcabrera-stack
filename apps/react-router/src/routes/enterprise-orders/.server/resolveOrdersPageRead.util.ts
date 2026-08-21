import { parseOrdersPageParams } from './parseOrdersPageParams.util';
import { resolveOrdersGroupRead } from './resolveOrdersGroupRead.util';

/**
 * `/paginated`'s search params as the read to run.
 *
 * The fetch vocabulary (`filter`, `sort`, `limit`, `skip`, `cursor`) parsed
 * once, then handed to the shared resolver that decides whether a group scopes
 * it. The modal route's loader skips this half — the table factory has already
 * parsed the page vocabulary by the time its `fetchPage` runs — and calls
 * `resolveOrdersGroupRead` directly, so the group rule is stated once for both.
 */
export const resolveOrdersPageRead = async (params: URLSearchParams) =>
  resolveOrdersGroupRead({ ...parseOrdersPageParams(params), params });
