import type { LeafFieldDef } from '#ui/components/Form/Form.types';

import { useGetFormMode } from '#ui/components/Form/contexts/FormContext/selectors';
import { FormFieldDisplay } from '#ui/components/Form/fields/FormFieldDisplay/FormFieldDisplay.component';

import type { FormFieldProps } from './FormField.types';

import { fieldRegistry } from './FormField.constants';

export const FormField = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldProps<TValues>) => {
  const mode = useGetFormMode();

  if (mode === 'view' && field.type !== 'custom') {
    return <FormFieldDisplay field={field} />;
  }

  const Renderer = fieldRegistry[field.type];

  return <Renderer field={field as LeafFieldDef<Record<string, unknown>>} />;
};
