/**
 * Round a monetary amount to two decimal places (cents), matching the
 * `numeric(12,2)` precision of the money columns. Uses half-up rounding on the
 * cent, with a tiny epsilon nudge so values like `1.005` round to `1.01`
 * instead of falling foul of binary floating-point representation.
 */
export const roundToCents = (amount: number) =>
  Math.round((amount + Number.EPSILON) * 100) / 100;
