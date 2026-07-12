import type { FormEvent } from 'react';

import { useSubmitForm } from '@repo/ui/components/Form/contexts/FormContext/actions';
import {
  useGetFormId,
  useGetFormSubmission,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { FormFields } from '@repo/ui/components/Form/FormFields/FormFields.component';
import * as stylex from '@stylexjs/stylex';
import { Form as RouterForm, useFetcher } from 'react-router';

import type { FormBodyProps } from './FormBody.types';

import { styles } from './FormBody.stylex';
import { FormBodyFooter } from './FormBodyFooter/FormBodyFooter.component';

/**
 * The Form view shell: picks the RR7 form flavour (fetcher vs navigation)
 * from the meta store and gates submit through the validation action. The
 * fetcher is keyed by formId so FormBodyFooter observes the same submission
 * state without prop drilling.
 */
export const FormBody = ({
  action,
  children,
  method = 'post',
}: FormBodyProps) => {
  const formId = useGetFormId();
  const submission = useGetFormSubmission();
  const submitForm = useSubmitForm();
  const fetcher = useFetcher({ key: formId });

  const FormComponent = submission === 'fetcher' ? fetcher.Form : RouterForm;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!submitForm()) {
      event.preventDefault();
    }
  };

  return (
    <FormComponent
      action={action}
      method={method}
      noValidate
      onSubmit={handleSubmit}
      {...stylex.props(styles.form)}
    >
      <input name='formId' type='hidden' value={formId} />
      <FormFields />
      <FormBodyFooter>{children}</FormBodyFooter>
    </FormComponent>
  );
};
