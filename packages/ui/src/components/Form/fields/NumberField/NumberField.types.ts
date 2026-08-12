import type { NumberFieldDef } from '#ui/components/Form/Form.types';

export type NumberFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: NumberFieldDef<TValues>;
};
