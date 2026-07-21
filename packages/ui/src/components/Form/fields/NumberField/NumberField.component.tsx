import { NumericFieldControl } from '@lcabrera/ui/components/Form/fields/NumericFieldControl/NumericFieldControl.component';

import type { NumberFieldProps } from './NumberField.types';

export const NumberField = <TValues extends Record<string, unknown>>({
  field,
}: NumberFieldProps<TValues>) => <NumericFieldControl<TValues> field={field} />;
