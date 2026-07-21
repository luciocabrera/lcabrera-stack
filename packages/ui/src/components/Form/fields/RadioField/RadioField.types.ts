import type { RadioFieldDef } from '@lcabrera/ui/components/Form/Form.types';

export type RadioFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: RadioFieldDef<TValues>;
};
