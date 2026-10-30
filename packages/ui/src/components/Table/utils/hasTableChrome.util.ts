import type { TableFeatures } from '../Table.types';

export const hasTableChrome = (features: Required<TableFeatures>) =>
  Object.values(features).includes(true);
