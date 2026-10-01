import { createGroupDetailReads } from '@lcabrera/server/table-page/create-group-detail-reads.util';
import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import { APP_ID } from '@/constants/app.constants';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from '../config';

import {
  resolveOrdersGroupRead,
  resolveOrdersGroupRestriction,
  selectOrdersPage,
} from '../.server/enterpriseOrders.service';
import {
  COLUMNS,
  GROUP_DETAILS_PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from '../EnterpriseOrders.constants';

export const loader = createTableRouteLoader<
  EnterpriseOrderTableRow,
  EnterpriseOrdersResponse
>({
  ...createGroupDetailReads({
    columns: COLUMNS,
    limit: INITIAL_PAGE_SIZE,
    reader: {
      resolveGroupRead: resolveOrdersGroupRead,
      resolveGroupRestriction: resolveOrdersGroupRestriction,
      selectPage: selectOrdersPage,
    },
  }),
  appId: APP_ID,
  columns: COLUMNS,
  filterOptions: { transport: 'loader' },
  meta: {
    isColumnLayoutTransient: true,
    isServerFilterEnabled: true,
    isUrlStateNested: true,
  },
  persistenceKey: GROUP_DETAILS_PERSISTENCE_KEY,
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});
