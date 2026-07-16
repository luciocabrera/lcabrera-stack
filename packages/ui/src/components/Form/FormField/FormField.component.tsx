import type { LeafFieldDef } from '@repo/ui/components/Form/Form.types';

import type { FormFieldProps } from './FormField.types';

import { fieldRegistry } from './FormField.constants';

export const FormField = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldProps<TValues>) => {
  const Renderer = fieldRegistry[field.type];

  return <Renderer field={field as LeafFieldDef<Record<string, unknown>>} />;
};
