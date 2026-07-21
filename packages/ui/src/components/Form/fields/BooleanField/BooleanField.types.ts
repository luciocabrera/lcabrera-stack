import type { BooleanFieldDef } from '@lcabrera/ui/components/Form/Form.types';

export type BooleanFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: BooleanFieldDef<TValues>;
};
