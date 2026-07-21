import type {
  CurrencyFieldDef,
  NumberFieldDef,
} from '@lcabrera/ui/components/Form/Form.types';
import type { ComponentProps, ReactNode } from 'react';

export type NumericFieldControlProps<TValues extends Record<string, unknown>> =
  {
    /** Optional slot rendered inside the input wrapper, before the input (e.g. a currency symbol). When present, the input reserves leading space for it. */
    readonly adornment?: ReactNode;
    readonly field: CurrencyFieldDef<TValues> | NumberFieldDef<TValues>;
    readonly inputMode?: ComponentProps<'input'>['inputMode'];
    readonly step?: ComponentProps<'input'>['step'];
  };
