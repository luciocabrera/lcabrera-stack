const EMPTY_GROUP_LABEL = '(empty)';

/**
 * The vocabulary is closed to what a **dimension** can be (ADR-058): text, boolean, date
 * and the low-cardinality numerics.
 */
export const toGroupLabel = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // Timestamps arrive parsed. ISO keeps them sortable and locale-free, which is
  // what a group heading wants — a formatted date belongs to the cell renderer.
  if (value instanceof Date) {
    return value.toISOString();
  }

  return EMPTY_GROUP_LABEL;
};
