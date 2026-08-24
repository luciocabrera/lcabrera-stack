import type { FormFieldsState } from '#ui/components/Form/contexts/FormContext/FormContext.types';
import type { FieldErrors, LeafFieldDef } from '#ui/components/Form/Form.types';

import { getInitialValues } from '#ui/components/Form/utils/getInitialValues.util';

type GetInitialFieldsStateArgs<TValues extends Record<string, unknown>> = {
  readonly initialValues?: Partial<TValues>;
  readonly leafFields: readonly LeafFieldDef<TValues>[];
  readonly serverErrors?: FieldErrors<TValues>;
};

export const getInitialFieldsState = <TValues extends Record<string, unknown>>({
  initialValues,
  leafFields,
  serverErrors,
}: GetInitialFieldsStateArgs<TValues>): FormFieldsState<TValues> => {
  const values = getInitialValues({ initialValues, leafFields });

  return { errors: serverErrors ?? {}, initialValues: values, values };
};
