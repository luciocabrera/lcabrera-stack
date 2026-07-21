import type { DateFieldDef } from '@lcabrera/ui/components/Form/Form.types';

export type DateFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: DateFieldDef<TValues>;
};
