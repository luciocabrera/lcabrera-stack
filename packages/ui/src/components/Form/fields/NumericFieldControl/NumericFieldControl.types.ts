import type { ComponentProps, ReactNode } from 'react';

import type {
  CurrencyFieldDef,
  NumberFieldDef,
} from '#ui/components/Form/Form.types';

export type NumericFieldControlProps<TValues extends Record<string, unknown>> =
  {
    readonly adornment?: ReactNode;
    readonly field: CurrencyFieldDef<TValues> | NumberFieldDef<TValues>;
    readonly inputMode?: ComponentProps<'input'>['inputMode'];
    readonly step?: ComponentProps<'input'>['step'];
  };
