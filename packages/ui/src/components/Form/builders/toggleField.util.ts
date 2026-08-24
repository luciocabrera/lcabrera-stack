export type ToggleFieldArgs<TValues extends Record<string, unknown>> = {
  readonly accessor: keyof TValues & string;
  readonly label: string;
};

export const toggleField = <TValues extends Record<string, unknown>>({
  accessor,
  label,
}: ToggleFieldArgs<TValues>) => ({
  accessor,
  label,
  type: 'boolean' as const,
  variant: 'toggle' as const,
});
