import type { OlapGroupPeriod } from '@lcabrera/api/olap/olap.types';

import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';
import { parseDrillGroup } from '@lcabrera/api/olap/parse-drill-group.util';

import type {
  GroupKeyTruncation,
  GroupRestriction,
  GroupRestrictionStatement,
  OlapGroupReadRefusal,
} from './olap.types';

import { GROUP_READ_REFUSAL_MESSAGE } from './olap.constants.ts';
import { resolveDrillRefusal } from './resolve-drill-refusal.util.ts';
import { toGroupLabel } from './to-group-label.util.ts';
import { toGroupPeriodLabel } from './to-group-period-label.util.ts';

type ResolveGroupRestrictionArgs = {
  readonly columns: readonly RestrictionColumn[];
  readonly isGroupRequired?: boolean;
  readonly params: URLSearchParams;
  readonly selectTruncations?: (
    periods: Readonly<Record<string, OlapGroupPeriod>>,
  ) => Promise<Readonly<Record<string, GroupKeyTruncation>>>;
};

type RestrictionColumn = {
  readonly key: PropertyKey;
  readonly label?: string;
};

type ToEntryArgs = {
  readonly columnKey: string;
  readonly columns: readonly RestrictionColumn[];
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
  readonly value: unknown;
};

const toRefusal = (
  reason: OlapGroupReadRefusal,
): GroupRestrictionStatement => ({
  entries: [],
  refusal: GROUP_READ_REFUSAL_MESSAGE[reason],
});

const toPeriodDate = (value: unknown) => {
  if (value instanceof Date) return value;

  return typeof value === 'string' || typeof value === 'number'
    ? new Date(value)
    : undefined;
};

const toEntry = ({
  columnKey,
  columns,
  truncations,
  value,
}: ToEntryArgs): GroupRestriction => {
  const column = columns.find((item) => String(item.key) === columnKey);
  const truncation = truncations?.[columnKey];
  const period =
    truncation === undefined
      ? undefined
      : toGroupPeriodLabel({ ...truncation, value: toPeriodDate(value) });

  return {
    columnKey,
    label: column?.label ?? columnKey,
    value: period ?? toGroupLabel(value),
  };
};

export const resolveGroupRestriction = async ({
  columns,
  isGroupRequired = false,
  params,
  selectTruncations,
}: ResolveGroupRestrictionArgs): Promise<
  GroupRestrictionStatement | undefined
> => {
  if (!params.has(OLAP_DRILL_GROUP_PARAM))
    return isGroupRequired ? toRefusal('absent') : undefined;

  const request = parseDrillGroup(params);

  if (request === undefined) return toRefusal('malformed');

  const rowRefusal = resolveDrillRefusal(request);

  if (rowRefusal !== undefined) return toRefusal(rowRefusal);

  const { periods } = request;
  const truncations =
    periods === undefined ? undefined : await selectTruncations?.(periods);

  return {
    entries: request.group.path.map(({ columnKey, value }) =>
      toEntry({ columnKey, columns, truncations, value }),
    ),
  };
};
