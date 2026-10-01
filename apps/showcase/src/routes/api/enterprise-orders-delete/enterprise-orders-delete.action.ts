import { createRowDeleteAction } from '@lcabrera/server/table-page/create-row-delete-action.util';
import { toIntegerRowId } from '@lcabrera/server/table-page/to-integer-row-id.util';

import { deleteOrder } from '@/routes/enterprise-orders/.server/enterpriseOrders.service';

export const action = createRowDeleteAction({
  deleteRow: deleteOrder,
  parseId: toIntegerRowId,
});
