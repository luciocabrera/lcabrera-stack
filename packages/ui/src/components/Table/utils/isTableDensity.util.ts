import type { TableDensity } from '../Table.types';

import { TABLE_DENSITY_SCALE } from '../Table.constants';

export const isTableDensity = (value: unknown): value is TableDensity =>
  typeof value === 'string' && Object.hasOwn(TABLE_DENSITY_SCALE, value);
