import type { BooleanFieldDef } from '@repo/ui/components/Form/Form.types';

export type BooleanFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: BooleanFieldDef<TValues>;
};
