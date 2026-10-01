import { createRowDeleteAction } from '@lcabrera/server/table-page/create-row-delete-action.util';
import { toIntegerRowId } from '@lcabrera/server/table-page/to-integer-row-id.util';

import { deleteRow } from '@/routes/orders/.server/orders.reader';

export const action = createRowDeleteAction({
  deleteRow,
  parseId: toIntegerRowId,
});
