import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

import { APP_ID } from '@/constants/app.constants';
import { fetchWideAlltypes150Page } from '@/services';

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
 * returned undecorated. The fetch promise is returned unawaited for Suspense
 * streaming.
 */
export const loader = createTableRouteLoader<
  WideAlltypes150,
  WideAlltypes150Response
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: ({ effectiveSorting, request }) =>
    fetchWideAlltypes150Page({
      limit: INITIAL_PAGE_SIZE,
      requestUrl: request.url,
      skip: 0,
      sorting: effectiveSorting,
    }),
  persistenceKey: PERSISTENCE_KEY,
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});
