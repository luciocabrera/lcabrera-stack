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

/**
 * The Form view shell: picks the RR7 form flavour (fetcher vs navigation)
 * from the meta store and gates submit through the validation action. The
 * fetcher is keyed by formId so FormBodyFooter observes the same submission
 * state without prop drilling.
 *
 * Also the layout owner: a flex column of scrollable fields + a pinned
 * footer, so the actions stay reachable in a height-capped host.
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
