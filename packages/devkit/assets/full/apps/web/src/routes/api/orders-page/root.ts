import { createTablePageLoader } from '@lcabrera/server/table-page/create-table-page-loader.util';

import {
  resolvePageRead,
  selectPage,
} from '@/routes/orders/.server/orders.reader';

export const loader = createTablePageLoader({ resolvePageRead, selectPage });
