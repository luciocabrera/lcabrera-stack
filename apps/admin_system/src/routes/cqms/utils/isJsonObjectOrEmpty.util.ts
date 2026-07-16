/**
 * True for an empty string or a string parsing to a non-null JSON object —
 * the `config_detection` contract (ADR-023). Unparseable input is simply
 * false rather than a throw, because this backs a zod `.refine` that owes the
 * user a field error.
 *
 * Note it accepts a JSON array too (`typeof [] === 'object'`), matching the
 * check both scanner forms have always used. fn_register_scanner remains the
 * authority, so an array still fails there rather than here.
 */
export const isJsonObjectOrEmpty = (value: string) => {
  if (value === '') {
    return true;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
};
