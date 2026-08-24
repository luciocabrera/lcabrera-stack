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

import { toDrillRead } from './to-drill-read.util.ts';

type ResolveGroupReadArgs = {
  readonly cursor?: readonly unknown[];
  readonly filters: readonly QueryFilter[];
  readonly isGroupRequired?: boolean;
  readonly limit: number;
  readonly maxLimit: number;
  readonly params: URLSearchParams;
  /** The column the route breaks ties on (ADR-008). */
  readonly primaryKey: string;
  /**
   * A catalogue lookup against the route's own table, so the route owns it; called only when
   * the token carries periods.
   */
  readonly selectTruncations?: (
    periods: Readonly<Record<string, OlapGroupPeriod>>,
  ) => Promise<Readonly<Record<string, GroupKeyTruncation>>>;
  readonly skip: number;
  readonly sort: readonly QuerySort[];
};

const REFUSAL_MESSAGE: Readonly<Record<OlapGroupReadRefusal, string>> = {
  absent: 'This page opens one group’s rows, and the link does not say which.',
  'grand-total':
    'A grand total already summarises every row, so there is no narrower set to open.',
  'incomplete-path':
    'This group is named by fewer keys than the view was grouped by, so the rows underneath it are not the rows it counted.',
  malformed: 'This link does not name a group that can be opened.',
  subtotal:
    'A subtotal summarises the groups above it rather than rows of its own.',
};

const toRefusal = (reason: OlapGroupReadRefusal): OlapGroupReadResolution => ({
  kind: 'refused',
  message: REFUSAL_MESSAGE[reason],
  reason,
});

/**
 * The read to run for a request that may name a group — scoped to it when it does, and
 * otherwise the plain paginated read (ADR-087).
 * `parseDrillGroup` answers `undefined` both for "no group here" and for "a group I cannot
 * read", so the param's *presence* is tested separately: without that, a mangled link
 * falls through to the unscoped read and serves the whole table under the group's heading.
 */
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
    // A route that serves only one group refuses instead: falling through would
    // read the whole set and hand it to a caller that titles every response as
    // a group — the same rows-under-the-wrong-heading failure an unreadable
    // token is refused for, reached by a link that simply lost its query.
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

  // A ternary rather than an early return, and not a style choice: an `if` with
  // an implicit else placed after an `await` makes v8-to-istanbul report the
  // else branch as taken `-1` times, and fallow refuses the whole coverage file
  // over it (`invalid value: integer -1, expected u32`) rather than reporting a
  // finding — so the audit dies on an unrelated error.
  //
  // `includeTotal` is re-asserted over the translation's `false`: that served
  // one bounded page beside a group row that already stated the count, where
  // this read pages and has to say how far it goes.
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
