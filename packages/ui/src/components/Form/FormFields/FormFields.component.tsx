import { useGetFormFields } from '#ui/components/Form/contexts/FormContext/selectors';

import { FormFieldsList } from './FormFieldsList/FormFieldsList.component';

/**
 * Store-connected root of the fields tree: reads the field definitions from
 * the form meta store and hands them to the recursive walker.
 */
export const FormFields = () => {
  const fields = useGetFormFields();

  return <FormFieldsList fields={fields} />;
};
