import type { FormFieldsState } from '@repo/ui/components/Form/contexts/FormContext/FormContext.types';
import type {
  FieldErrors,
  LeafFieldDef,
} from '@repo/ui/components/Form/Form.types';

import { getInitialValues } from '@repo/ui/components/Form/utils/getInitialValues.util';

type GetInitialFieldsStateArgs<TValues extends Record<string, unknown>> = {
  readonly initialValues?: Partial<TValues>;
  readonly leafFields: readonly LeafFieldDef<TValues>[];
  readonly serverErrors?: FieldErrors<TValues>;
};

/**
 * Build the fields store's initial snapshot: the resolved initial values
 * (typed defaults for accessors the caller didn't provide), the frozen
 * pristine dirty-check baseline, and any server errors carried into the
 * first render.
 */
export const getInitialFieldsState = <TValues extends Record<string, unknown>>({
  initialValues,
  leafFields,
  serverErrors,
}: GetInitialFieldsStateArgs<TValues>): FormFieldsState<TValues> => {
  const values = getInitialValues({ initialValues, leafFields });

  return { errors: serverErrors ?? {}, initialValues: values, values };
};
