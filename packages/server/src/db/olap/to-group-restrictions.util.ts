import { parseDrillGroup } from '@lcabrera/api/olap/parse-drill-group.util';

import type { GroupKeyTruncation, GroupRestriction } from './olap.types';

import { toGroupLabel } from './to-group-label.util.ts';
import { toGroupPeriodLabel } from './to-group-period-label.util.ts';

type ToGroupRestrictionsArgs = {
  readonly columns: readonly {
    readonly key: PropertyKey;
    readonly label?: string;
  }[];
  readonly params: URLSearchParams;
  readonly truncations?: Readonly<Record<string, GroupKeyTruncation>>;
};

const toPeriodDate = (value: unknown) => {
  if (value instanceof Date) return value;

  return typeof value === 'string' || typeof value === 'number'
    ? new Date(value)
    : undefined;
};

/**
 * What restricts the rows a route serving one group answers with — one entry per key,
 * outermost first — or `undefined` when the request names no readable group (ADR-087).
 * Every surface stating the group reads this one answer, so a heading and a filters panel
 * cannot end up naming different groups.
 * **A caller may not read `undefined` as "nothing restricts these rows".** It is equally
 * the answer to a token `parseDrillGroup` refuses, so a surface drawing it as an empty
 * list says the opposite of what happened.
 */
export const toGroupRestrictions = ({
  columns,
  params,
  truncations,
}: ToGroupRestrictionsArgs): readonly GroupRestriction[] | undefined => {
  const request = parseDrillGroup(params);

  if (request === undefined) return;

  return request.group.path.map(({ columnKey, value }) => {
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
  });
};
