import { isObject } from '@lcabrera/utils/guards/is-object.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';

import type { OlapDrillRequest, OlapGroupPeriod } from './olap.types';

import { isOlapGroupPeriod } from './is-olap-group-period.util';
import { OLAP_DRILL_GROUP_PARAM } from './olap.constants';

const toPathEntry = (entry: unknown) => {
  if (!isObject(entry)) return;

  const { columnKey, value } = entry;

  return typeof columnKey === 'string' && Object.hasOwn(entry, 'value')
    ? { columnKey, value }
    : undefined;
};

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
