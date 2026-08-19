/** What a NULL group key reads as. A group of rows missing the key is a group. */
const EMPTY_GROUP_LABEL = '(empty)';

/**
 * Formats one group key value for display.
 *
 * The vocabulary is closed to what a **dimension** can be (ADR-058): text,
 * boolean, date and the low-cardinality numerics. `pg` hands those back as
 * strings, booleans, numbers and `Date` objects, and nothing else can reach a
 * group key — a `jsonb` or geometric column is refused as a key long before it
 * gets here.
 *
 * Refusing to guess at anything outside that set is deliberate. `String()` over
 * an unexpected object yields `[object Object]`, which reads as a group name and
 * is not one; `(empty)` at least says the value could not be read.
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
