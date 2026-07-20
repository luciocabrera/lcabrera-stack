export type ToggleFieldArgs<TValues extends Record<string, unknown>> = {
  readonly accessor: keyof TValues & string;
  readonly label: string;
};

/**
 * Build a boolean toggle field (`type: 'boolean'`, `variant: 'toggle'`). Bind
 * `TValues` once via `createFieldBuilders<TValues>()` so call sites need no
 * explicit type arguments.
 */
export const toggleField = <TValues extends Record<string, unknown>>({
  accessor,
  label,
}: ToggleFieldArgs<TValues>) => ({
  accessor,
  label,
  type: 'boolean' as const,
  variant: 'toggle' as const,
});
