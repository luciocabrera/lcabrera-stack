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
