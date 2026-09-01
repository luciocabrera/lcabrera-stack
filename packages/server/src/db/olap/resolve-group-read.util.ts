import type { OlapGroupPeriod } from '@lcabrera/api/olap/olap.types';

import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';
import { parseDrillGroup } from '@lcabrera/api/olap/parse-drill-group.util';

import type {
  QueryFilter,
  QuerySort,
} from '../query-builder/query-builder.types';
import type {
  GroupKeyTruncation,
  OlapGroupReadRefusal,
  OlapGroupReadResolution,
} from './olap.types';

import { GROUP_READ_REFUSAL_MESSAGE } from './olap.constants.ts';
import { toDrillRead } from './to-drill-read.util.ts';

type ResolveGroupReadArgs = {
  readonly cursor?: readonly unknown[];
  readonly filters: readonly QueryFilter[];
  readonly isGroupRequired?: boolean;
  readonly limit: number;
  readonly maxLimit: number;
  readonly params: URLSearchParams;
  readonly primaryKey: string;
  readonly selectTruncations?: (
    periods: Readonly<Record<string, OlapGroupPeriod>>,
  ) => Promise<Readonly<Record<string, GroupKeyTruncation>>>;
  readonly skip: number;
  readonly sort: readonly QuerySort[];
};

const toRefusal = (reason: OlapGroupReadRefusal): OlapGroupReadResolution => ({
  kind: 'refused',
  message: GROUP_READ_REFUSAL_MESSAGE[reason],
  reason,
});

export const resolveGroupRead = async ({
  cursor,
  filters,
  isGroupRequired = false,
  limit,
  maxLimit,
  params,
  primaryKey,
  selectTruncations,
  skip,
  sort,
}: ResolveGroupReadArgs): Promise<OlapGroupReadResolution> => {
  const isFirstPage = skip === 0;

  if (!params.has(OLAP_DRILL_GROUP_PARAM)) {
    if (isGroupRequired) return toRefusal('absent');

    return {
      kind: 'read',
      read: {
        cursor,
        filters,
        includeTotal: isFirstPage,
        limit,
        offset: skip,
        sort,
      },
    };
  }

  const request = parseDrillGroup(params);

  if (request === undefined) return toRefusal('malformed');

  const { periods } = request;
  const drill = toDrillRead({
    filters,
    group: request.group,
    groupKeys: request.groupKeys,
    limit,
    maxLimit,
    primaryKey,
    sort,
    truncations:
      periods === undefined ? undefined : await selectTruncations?.(periods),
  });

  return drill.kind === 'refused'
    ? toRefusal(drill.reason)
    : {
        kind: 'read',
        read: {
          ...drill.read,
          cursor,
          includeTotal: isFirstPage,
          offset: skip,
        },
      };
};
