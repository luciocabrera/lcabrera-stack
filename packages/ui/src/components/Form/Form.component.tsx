import { useId } from 'react';

import type { FormProps } from './Form.types';

import { FormProvider } from './contexts';
import { FormBody } from './FormBody/FormBody.component';
import { flattenFields } from './utils/flattenFields.util';
import { getInitialValues } from './utils/getInitialValues.util';

export const Form = <TValues extends Record<string, unknown>>({
  initialValues,
  mode,
  serverErrors,
  ...bodyProps
}: FormProps<TValues>) => {
  const formId = useId();
  const leafFields = flattenFields(bodyProps.fields);
  const values = getInitialValues({ initialValues, leafFields });
  // TODO: The init shouldhappen insidde the FormProvider  as the other Provider do, they do have an util to do that
  // leafFields is just prop drilled, if is used in multiple places should be setup in the store  and use a gettter in the components that use it
  // no prop drilled

  // THE fields should be persisted in the store and have a selector so the consumers can use it , they are to a form  what  columns are for the table
  // formId  should be persisted in the store, we have to follow the same patterns used for the table component (metadata store in same context could be)
  // so keys like formId, mode should be in the metadata store (need to evaluate what other stuffss could be there)
  // also any other specific form medata that is needed should be in the metadata store (labels???)
  return (
    <FormProvider
      initialFieldsState={{
        errors: serverErrors ?? {},
        initialValues: values,
        values,
      }}
      mode={mode}
      serverErrors={serverErrors}
    >
      <FormBody {...bodyProps} formId={formId} leafFields={leafFields} />
    </FormProvider>
  );
};
