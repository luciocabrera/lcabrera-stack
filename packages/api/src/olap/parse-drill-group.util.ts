import { isObject } from '@lcabrera/utils/guards/is-object.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';

import type { OlapDrillRequest, OlapGroupPeriod } from './olap.types';

import { isOlapGroupPeriod } from './is-olap-group-period.util';
import { OLAP_DRILL_GROUP_PARAM } from './olap.constants';

/**
 * One path entry, narrowed the way a group summary is narrowed on the grid side.
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
    ? { columnKey, value }
    : undefined;
};

/**
 * The granularity map, or `undefined` when it is present and unreadable — which
 * the caller must treat as a refusal rather than as "no granularities".
 *
 * A period outside the vocabulary refuses the whole descriptor for the same
 * reason a malformed path entry does: it would drill a different set from the
 * one the row summarises, with every returned row individually valid (#786).
 *
 * **A granularity naming a column that is not a group key is refused here too**,
 * which is what keeps this half of the wire under the same rule as the other:
 * `groupingCodec` refuses one on the grouping param and `assertGroupKeys`
 * refuses it again before SQL. Leaving the drill param looser would let a
 * request through that the grouped read it claims to drill could not have been
 * issued from — and would cost a catalogue lookup for a column nothing else in
 * the request mentions.
 */
const toPeriods = ({
  keys,
  value,
}: {
  readonly keys: readonly string[];
  readonly value: unknown;
}): Readonly<Record<string, OlapGroupPeriod>> | undefined => {
  if (!isObject(value) || Array.isArray(value)) return;

  const entries = Object.entries(value);
  const applied = new Set(keys);

  return entries.every(
    ([column, period]) => isOlapGroupPeriod(period) && applied.has(column),
  )
    ? (Object.fromEntries(entries) as Readonly<Record<string, OlapGroupPeriod>>)
    : undefined;
};

/**
 * The group a drill request names, or `undefined` when the request does not name
 * one — which a route answers `400` to, never an empty page.
 *
 * **A partly-narrowed group is refused whole.** One path entry that does not
 * narrow rejects the entire descriptor rather than being dropped, because a
 * drill built from *some* of a group's keys is a query for a different, larger
 * set — it would return rows, all of them plausible, none of them the group the
 * user clicked.
 */
export const parseDrillGroup = (
  params: URLSearchParams,
): OlapDrillRequest | undefined => {
  const raw = safeJsonParse(params.get(OLAP_DRILL_GROUP_PARAM));

  if (!isObject(raw)) return;

  const { isSubtotal, keys, path, periods: rawPeriods } = raw;

  if (
    typeof isSubtotal !== 'boolean' ||
    !Array.isArray(keys) ||
    !Array.isArray(path) ||
    !keys.every((key): key is string => typeof key === 'string')
  )
    return;

  const hasPeriods = Object.hasOwn(raw, 'periods');
  const periods = hasPeriods
    ? toPeriods({ keys, value: rawPeriods })
    : undefined;

  if (hasPeriods && periods === undefined) return;

  const entries = path.map((entry) => toPathEntry(entry));

  return entries.every((entry) => entry !== undefined)
    ? {
        group: { isSubtotal, path: entries },
        groupKeys: keys,
        ...(periods !== undefined && { periods }),
      }
    : undefined;
};
