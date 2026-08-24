/**
 * Build the human-facing order number from a numeric `order_id`: the prefix `ORD-`
 * followed by the id zero-padded to 8 digits (e.g.
 */
export const formatOrderNumber = (orderId: number) =>
  `ORD-${String(orderId).padStart(8, '0')}`;
