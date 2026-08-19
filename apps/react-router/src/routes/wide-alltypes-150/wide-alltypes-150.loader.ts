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
 * Loader for the wide-columns route. No `filterOptions` — this route's filter
 * support is deliberately minimal (see its ARCHITECTURE.md), so columns are
 * returned undecorated. The read promise is returned unawaited for Suspense
 * streaming.
 *
 * `readWideAlltypes150Page` reads Postgres **server-side** by default — no
 * api-server round-trip — and goes to the external endpoint only when
 * `VITE_API_URL` asks for it.
 *
 * **Grouping is declared from that same switch** (#575). It is the one
 * capability here the external endpoint cannot serve, so offering it while the
 * rows come from another process would summarise a different result set than the
 * page it sits above. `isExternalApiEnabled` is read once, at module scope,
 * because `meta` is a fixed object the factory captures when this file is
 * evaluated — and in a build the whole call folds to a constant anyway.
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
