import { createTablePageLoader } from '@lcabrera/server/table-page/create-table-page-loader.util';

import {
  resolveOrdersPageRead,
  selectOrdersPage,
} from '@/routes/enterprise-orders/.server/enterpriseOrders.service';

export const loader = createTablePageLoader({
  resolvePageRead: resolveOrdersPageRead,
  selectPage: selectOrdersPage,
});
