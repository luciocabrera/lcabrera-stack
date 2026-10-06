import { createTableLoaderReads } from '@lcabrera/server/table-page/create-table-loader-reads.util';
import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import { APP_ID } from '@/constants/app.constants';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from './config';

import {
  selectOrderGroupingCapabilities,
  selectOrdersPage,
} from './.server/enterpriseOrders.service';
import { ENTERPRISE_ORDERS_GROUP_PATH } from './config';
import {
  CELL_PALETTE,
  COLUMNS,
  CRUD,
  DELETE_ACTION_PATH,
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './EnterpriseOrders.constants';

export const loader = createTableRouteLoader<
  EnterpriseOrderTableRow,
  EnterpriseOrdersResponse
>({
  ...createTableLoaderReads({
    limit: INITIAL_PAGE_SIZE,
    reader: {
      selectGroupingCapabilities: selectOrderGroupingCapabilities,
      selectPage: selectOrdersPage,
    },
  }),
  appId: APP_ID,
  cellPalette: CELL_PALETTE,
  columns: COLUMNS,
  filterOptions: { transport: 'loader' },
  // This endpoint filters server-side, seeks, and groups, so it declares all
  // three capabilities (ADR-063); they travel with the loader data for the
  // table's load-more and header menu to read. The `filters` forwarded above is
  // separate and unconditional — nothing gates the first page on that flag, so
  // setting `isServerFilterEnabled: false` here would stop later pages
  // filtering while the first page still did. `isGroupingEnabled` is not like
  // that: it is what makes the loader read the `grouping` param at all, so
  // removing it switches grouping off end to end.
  meta: {
    crud: CRUD,
    deleteActionPath: DELETE_ACTION_PATH,
    groupDetailsPath: ENTERPRISE_ORDERS_GROUP_PATH,
    isGroupingEnabled: true,
    isKeysetEnabled: true,
    isServerFilterEnabled: true,
  },
  persistenceKey: PERSISTENCE_KEY,
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});
