import type { LeafFieldDef } from '#ui/components/Form/Form.types';

export type FormFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: LeafFieldDef<TValues>;
};
