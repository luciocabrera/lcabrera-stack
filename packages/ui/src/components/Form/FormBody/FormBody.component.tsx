import type { SubmitEvent } from 'react';

import * as stylex from '@stylexjs/stylex';
import { Form as RouterForm, useFetcher } from 'react-router';

import { useSubmitForm } from '#ui/components/Form/contexts/FormContext/actions';
import {
  useGetFormId,
  useGetFormSubmission,
} from '#ui/components/Form/contexts/FormContext/selectors';
import { FormFields } from '#ui/components/Form/FormFields/FormFields.component';
import { FormFooter } from '#ui/components/Form/FormFooter';

import type { FormBodyProps } from './FormBody.types';

import { styles } from './FormBody.stylex';

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

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
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
      <FormFooter>{children}</FormFooter>
    </FormComponent>
  );
};
