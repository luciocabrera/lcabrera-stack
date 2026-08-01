import type {
  CurrencyFieldDef,
  NumberFieldDef,
} from '@lcabrera/ui/components/Form/Form.types';
import type { ComponentProps, ReactNode } from 'react';

export type NumericFieldControlProps<TValues extends Record<string, unknown>> =
  {
    /** Optional slot rendered inside the input wrapper (e.g. a currency symbol). Position it yourself; when present the input reserves trailing space, since the value is right-aligned. */
    readonly adornment?: ReactNode;
    readonly field: CurrencyFieldDef<TValues> | NumberFieldDef<TValues>;
    readonly inputMode?: ComponentProps<'input'>['inputMode'];
    readonly step?: ComponentProps<'input'>['step'];
  };
