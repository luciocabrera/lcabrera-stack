import { encodeDrillGroup } from '@lcabrera/api/olap/encode-drill-group.util';
import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';

import type {
  TableGroupPeriod,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { TABLE_NESTED_URL_STATE_PREFIX } from '#ui/components/Table/Table.constants';

type ResolveGroupDetailsHrefArgs = {
  readonly groupDetailsPath: string | undefined;
  readonly groupingKeys: readonly string[];
  readonly periods: Readonly<Record<string, TableGroupPeriod>>;
  readonly search: string;
  readonly summary: TableGroupRowSummary;
};

export const resolveGroupDetailsHref = ({
  groupDetailsPath,
  groupingKeys,
  periods,
  search,
  summary,
}: ResolveGroupDetailsHrefArgs) => {
  if (
    groupDetailsPath === undefined ||
    summary.isSubtotal ||
    summary.path.length === 0 ||
    summary.path.length !== groupingKeys.length
  ) {
    return;
  }

  const params = new URLSearchParams(
    [...new URLSearchParams(search)].filter(
      ([key]) => !key.startsWith(TABLE_NESTED_URL_STATE_PREFIX),
    ),
  );

  for (const key of ['filters', 'sorting']) {
    const value = params.get(key);

    if (value !== null) {
      params.set(`${TABLE_NESTED_URL_STATE_PREFIX}${key}`, value);
    }
  }

  params.set(
    OLAP_DRILL_GROUP_PARAM,
    encodeDrillGroup({
      group: { isSubtotal: false, path: summary.path },
      groupKeys: groupingKeys,
      periods,
    }),
  );

  return `${groupDetailsPath}?${params.toString()}`;
};
