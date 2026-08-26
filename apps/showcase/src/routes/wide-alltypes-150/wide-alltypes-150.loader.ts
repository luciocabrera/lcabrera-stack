import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import type { WideAlltypes150 } from '@/services';

import { APP_ID } from '@/constants/app.constants';
import { isExternalApiEnabled } from '@/services/isExternalApiEnabled.util';

import type { WideAlltypes150TableResponse } from './config';

import {
  readWideAlltypes150Page,
  selectWideAlltypes150GroupingCapabilities,
} from './.server/wideAlltypes150.service';
import {
  COLUMNS,
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './WideAlltypes150.constants';

/**
 * No `filterOptions`, and columns are returned undecorated: this loader appends no
 * distinct filter descriptors because the endpoint behind it supports none. It
 * declares neither `isKeysetEnabled` nor `isServerFilterEnabled` on its `meta`, and
 * absent means off (ADR-063), so load-more carries `limit`, `skip` and `sort` only.
 * `COLUMNS` is fully serializable with no functions (ADR-009), which is what lets the
 * loader return it directly inside `columnsState`.
 * **Grouping is declared from that same switch** (#575).
 */
const IS_SELF_HOSTED = !isExternalApiEnabled();
export const loader = createTableRouteLoader<
  WideAlltypes150,
  WideAlltypes150TableResponse
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: ({ effectiveSorting, grouping, request }) =>
    readWideAlltypes150Page({
      // Already sanitized against this route's columns, and empty unless the
      // capability below is declared — so this is a forward, not a decision.
      grouping,
      limit: INITIAL_PAGE_SIZE,
      requestUrl: request.url,
      skip: 0,
      sorting: effectiveSorting,
    }),
  meta: { isGroupingEnabled: IS_SELF_HOSTED },
  persistenceKey: PERSISTENCE_KEY,
  // What each column may do in a grouped read, from the pg catalogue (ADR-058).
  // This route is where that matters most: 150 columns of deliberately mixed
  // types, so a menu built from the coarse `dataType` vocabulary would be wrong
  // on a large fraction of them (#550).
  resolveGroupingCapabilities: IS_SELF_HOSTED
    ? selectWideAlltypes150GroupingCapabilities
    : undefined,
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});
