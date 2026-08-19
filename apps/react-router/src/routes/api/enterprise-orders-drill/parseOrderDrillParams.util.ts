import { isObject } from '@lcabrera/utils/guards/is-object.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';

import type { OrderDrillGroup } from '@/routes/enterprise-orders/.server/toOrderDrillRead.util';

export type ParsedOrderDrillGroup = {
  readonly groupKeys: readonly string[];
  readonly summary: OrderDrillGroup;
};

/**
 * One path entry, narrowed the same way `getTableGroupRowSummary` narrows it.
 *
 * `value` is checked for **presence**, not for type: a key is whatever its
 * column is, and `null` is a legitimate key rather than a missing one — the NULL
 * group is a group, and it is precisely the group a drill would otherwise
 * silently return nothing for. An entry carrying no `value` member at all is
 * malformed, and `Object.hasOwn` is what separates the two.
 */
const toPathEntry = (entry: unknown) => {
  if (!isObject(entry)) return;

  const { columnKey, value } = entry;

  return typeof columnKey === 'string' && Object.hasOwn(entry, 'value')
    ? { columnKey, label: '', value }
    : undefined;
};

/**
 * The group a drill request names, or `undefined` when the request does not
 * name one this route can act on.
 *
 * **A partly-narrowed group is refused whole.** One path entry that does not
 * narrow rejects the entire descriptor rather than being dropped, because a
 * drill built from *some* of a group's keys is a query for a different, larger
 * set — it would return rows, all of them plausible, none of them the group the
 * user clicked. Same rule, and same reason, as `getTableGroupRowSummary`.
 *
 * `label` is filled with an empty string rather than carried over the wire: the
 * translation never reads it, and a formatted display string has no business
 * crossing into a query. What a drill is built from is `value`.
 */
export const parseOrderDrillGroup = (
  params: URLSearchParams,
): ParsedOrderDrillGroup | undefined => {
  const raw = safeJsonParse(params.get('group'));

  if (!isObject(raw)) return;

  const { isSubtotal, keys, path } = raw;

  if (
    typeof isSubtotal !== 'boolean' ||
    !Array.isArray(keys) ||
    !Array.isArray(path) ||
    keys.some((key) => typeof key !== 'string')
  )
    return;

  const entries = path.map((entry) => toPathEntry(entry));

  return entries.every((entry) => entry !== undefined)
    ? {
        groupKeys: keys,
        summary: { isSubtotal, path: entries },
      }
    : undefined;
};
