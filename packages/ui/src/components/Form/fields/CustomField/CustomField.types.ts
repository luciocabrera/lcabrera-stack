import type { CustomFieldDef } from '@lcabrera/ui/components/Form/Form.types';

export type CustomFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: CustomFieldDef<TValues>;
};
