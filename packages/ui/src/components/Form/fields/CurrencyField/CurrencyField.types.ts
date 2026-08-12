import type { CurrencyFieldDef } from '#ui/components/Form/Form.types';

export type CurrencyFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: CurrencyFieldDef<TValues>;
};
