import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

export const areGroupKeysLegal = (keys: readonly string[]) =>
  keys.length <= MAX_TABLE_GROUP_KEYS && new Set(keys).size === keys.length;
