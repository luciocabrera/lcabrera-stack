import type { DateFieldDef } from '@repo/ui/components/Form/Form.types';

export type DateFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: DateFieldDef<TValues>;
};
