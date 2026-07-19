import type { CurrencyFieldDef } from '@repo/ui/components/Form/Form.types';

export type CurrencyFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: CurrencyFieldDef<TValues>;
};
