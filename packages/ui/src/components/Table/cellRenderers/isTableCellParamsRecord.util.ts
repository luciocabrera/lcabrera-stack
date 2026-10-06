import { isObject } from '@lcabrera/utils/guards/is-object.util';

export const isTableCellParamsRecord = (
  value: unknown,
): value is Readonly<Record<string, unknown>> =>
  isObject(value) && !Array.isArray(value);
