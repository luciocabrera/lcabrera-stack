export const createTableRefusalReasonGuard =
  <TReason extends string>(reasons: Readonly<Record<TReason, true>>) =>
  (value: unknown): value is TReason =>
    typeof value === 'string' && Object.hasOwn(reasons, value);
