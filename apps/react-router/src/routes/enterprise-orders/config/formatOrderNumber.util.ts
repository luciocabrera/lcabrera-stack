/**
 * Build the human-facing order number from a numeric `order_id`: the prefix
 * `ORD-` followed by the id zero-padded to 8 digits (e.g. `42` → `ORD-00000042`).
 * Matches the `ORDER_NUMBER_PATTERN` regex the schema documents. Ids with more
 * than 8 digits are not truncated.
 */
export const formatOrderNumber = (orderId: number) =>
  `ORD-${String(orderId).padStart(8, '0')}`;
