import { parseDrillGroup } from '@lcabrera/api/olap/parse-drill-group.util';

import type { GroupKeyTruncation } from './olap.types';

import { toGroupLabel } from './to-group-label.util.ts';
import { toGroupPeriodLabel } from './to-group-period-label.util.ts';

type ToGroupHeadingArgs = {
  readonly columns: readonly {
    readonly key: PropertyKey;
    readonly label?: string;
  }[];
  readonly params: URLSearchParams;
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

const HEADING_SEPARATOR = ' · ';

const toPeriodDate = (value: unknown) => {
  if (value instanceof Date) return value;

  return typeof value === 'string' || typeof value === 'number'
    ? new Date(value)
    : undefined;
};

/**
 * The heading for a route serving one group's rows — one `Label: value` per key, outermost
 * first, or `undefined` when the request names no readable group (ADR-087).
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
