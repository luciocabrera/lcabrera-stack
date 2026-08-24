import { parseDrillGroup } from '@lcabrera/api/olap/parse-drill-group.util';

import type { GroupKeyTruncation } from './olap.types';

import { toGroupLabel } from './to-group-label.util.ts';
import { toGroupPeriodLabel } from './to-group-period-label.util.ts';

type ToGroupHeadingArgs = {
  /**
   * The route's declared columns, for the label each key is named by. Read
   * structurally, so a caller passes its own column list unchanged.
   */
  readonly columns: readonly {
    readonly key: PropertyKey;
    readonly label?: string;
  }[];
  readonly params: URLSearchParams;
  /** How each truncated key was derived, by column. */
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

const HEADING_SEPARATOR = ' · ';

/**
 * A period key survives the token as the instant it was truncated to, not as a
 * `Date` — JSON keeps the ISO string. The instant is what matters: reading its
 * fields back in the frame `isZoned` names recovers the wall clock the group
 * was truncated on.
 */
const toPeriodDate = (value: unknown) => {
  if (value instanceof Date) return value;

  return typeof value === 'string' || typeof value === 'number'
    ? new Date(value)
    : undefined;
};

/**
 * The heading for a route serving one group's rows — one `Label: value` per
 * key, outermost first, or `undefined` when the request names no readable group
 * (ADR-087).
 *
 * **Built from the token, because the token carries no labels.**
 * `encodeDrillGroup` drops the group row's formatted `label` on purpose — a
 * display string has no business reaching a query — so only raw values survive
 * the round trip, and turning those back into text is this package's job.
 * Rebuilding it on the client would be a second formatter free to disagree with
 * the row the reader clicked.
 *
 * **A truncated key is formatted as its period.** The group row reads `2021-06`;
 * the value underneath it is the period's first instant, so `toGroupLabel`
 * would render `2021-06-01T00:00:00.000Z` and disagree with that row.
 */
export const toGroupHeading = ({
  columns,
  params,
  truncations,
}: ToGroupHeadingArgs) => {
  const request = parseDrillGroup(params);

  if (request === undefined) return;

  return request.group.path
    .map(({ columnKey, value }) => {
      const column = columns.find((entry) => String(entry.key) === columnKey);
      const truncation = truncations?.[columnKey];
      const period =
        truncation === undefined
          ? undefined
          : toGroupPeriodLabel({ ...truncation, value: toPeriodDate(value) });

      return `${column?.label ?? columnKey}: ${period ?? toGroupLabel(value)}`;
    })
    .join(HEADING_SEPARATOR);
};
