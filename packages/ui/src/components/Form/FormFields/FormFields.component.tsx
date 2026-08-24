import { useGetFormFields } from '#ui/components/Form/contexts/FormContext/selectors';

import { FormFieldsList } from './FormFieldsList/FormFieldsList.component';

export const FormFields = () => {
  const fields = useGetFormFields();

  return <FormFieldsList fields={fields} />;
};
