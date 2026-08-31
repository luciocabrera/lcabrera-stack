import { TABLE_GROUP_ROW_FIELD } from '../Table.constants';

export const hasTableStructuralMarker = (row: Record<string, unknown>) =>
  Object.hasOwn(row, TABLE_GROUP_ROW_FIELD);
