import type { TextFieldDef } from '#ui/components/Form/Form.types';

export type TextFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: TextFieldDef<TValues>;
};
