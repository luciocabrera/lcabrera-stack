import type { DateFieldDef } from '#ui/components/Form/Form.types';

export type DateFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: DateFieldDef<TValues>;
};
