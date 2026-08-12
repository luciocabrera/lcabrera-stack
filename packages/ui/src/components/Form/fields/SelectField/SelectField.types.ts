import type { SelectFieldDef } from '#ui/components/Form/Form.types';

export type ResolveSelectedValuesArgs = {
  readonly mode: 'multi' | 'single';
  readonly value: unknown;
};

export type SelectFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: SelectFieldDef<TValues>;
};
