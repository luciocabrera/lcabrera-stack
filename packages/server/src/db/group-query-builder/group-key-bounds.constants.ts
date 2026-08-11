/**
 * A group key above this many distinct values produces a tree nobody reads and
 * a payload nobody wants. It bounds the **key**, which is why it lives here
 * rather than with the result-size guard rails.
 */
export const MAX_GROUP_KEY_DISTINCT = 1000;

/**
 * At or above this share of the row count a column is treated as unique-ish and
 * refused, because a "group" per row is not a grouping. Deliberately below 1:
 * `n_distinct` is an estimate, so an exact-equality test would miss the primary
 * key it exists to catch.
 */
export const UNIQUE_ISH_DISTINCT_RATIO = 0.95;
