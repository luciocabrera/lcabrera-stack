import type { LeafFieldDef } from '@repo/ui/components/Form/Form.types';

import { useGetFormMode } from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { FormFieldDisplay } from '@repo/ui/components/Form/fields/FormFieldDisplay/FormFieldDisplay.component';

import type { FormFieldProps } from './FormField.types';

import { fieldRegistry } from './FormField.constants';

export const FormField = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldProps<TValues>) => {
  const mode = useGetFormMode();

  // View mode renders each leaf as read-only label + value text rather than a
  // disabled widget (custom fields keep their own escape-hatch renderer).
  if (mode === 'view' && field.type !== 'custom') {
    return <FormFieldDisplay field={field} />;
  }

  const Renderer = fieldRegistry[field.type];

  return <Renderer field={field as LeafFieldDef<Record<string, unknown>>} />;
};
