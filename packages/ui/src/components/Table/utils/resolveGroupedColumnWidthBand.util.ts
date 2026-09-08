/**
 * The width band a grouped grid's columns are sized within, read from the
 * consuming build's environment so an installer can widen it without forking a
 * column definition (ADR-113).
 */
import {
  DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH,
  DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH,
} from '../Table.constants';
import { resolveDeclaredWidth } from './resolveDeclaredWidth.util';

export const resolveGroupedColumnWidthBand = () => {
  const minWidth = resolveDeclaredWidth({
    declared: import.meta.env.VITE_TABLE_AGGREGATE_MIN_WIDTH,
    fallback: DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH,
  });
  const maxWidth = resolveDeclaredWidth({
    declared: import.meta.env.VITE_TABLE_AGGREGATE_MAX_WIDTH,
    fallback: DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH,
  });

  return { maxWidth: Math.max(minWidth, maxWidth), minWidth };
};
