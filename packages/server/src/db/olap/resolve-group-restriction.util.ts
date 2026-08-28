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
  /**
   * Set by a route whose every response is titled as one group: there, a request carrying
   * no token is refused rather than answered as "nothing restricts these rows"
   * ([ADR-087](../../../../../docs/decisions/ADR-087-a-group-opens-its-rows-in-a-route.md)
   * decision 6b).
   */
  readonly isGroupRequired?: boolean;
  readonly params: URLSearchParams;
  /**
   * A catalogue lookup against the caller's own table, so the caller owns it; called only
   * when the token carries granularities.
   */
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

/**
 * What restricts the rows a request naming one group is answered with — one entry per key,
 * outermost first — or a `refusal` carrying the same sentence the refused read renders
 * ([ADR-094](../../../../../docs/decisions/ADR-094-a-scoped-table-states-its-restriction-and-opens-declared.md)).
 * It refuses on the same conditions as `resolveGroupRead`, in the same order and out of the
 * same message map, which is what the contract test beside it pins.
 * `undefined` means nothing restricts this read, which only a caller that does not require
 * a token can be answered with.
 */
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
