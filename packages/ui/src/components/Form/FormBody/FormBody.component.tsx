import type { FormEvent } from 'react';

import { useSubmitForm } from '@repo/ui/components/Form/contexts/FormContext/actions';
import { FormFields } from '@repo/ui/components/Form/FormFields/FormFields.component';
import * as stylex from '@stylexjs/stylex';
import { Form as RouterForm, useFetcher, useNavigation } from 'react-router';

import type { FormBodyProps } from './FormBody.types';

import { styles } from './FormBody.stylex';
import { FormBodyFooter } from './FormBodyFooter/FormBodyFooter.component';

/**
 * The Form view shell: picks the RR7 form flavour (fetcher vs navigation),
 * derives the submission state it owns, and gates submit through the
 * validation action. Footer buttons and the discard-changes flow live in the
 * self-connected FormBodyFooter delegate.
 */
export const FormBody = <TValues extends Record<string, unknown>>({
  action,
  cancelLabel,
  cancelTo,
  children,
  fields,
  formId,
  leafFields,
  method = 'post',
  submission = 'navigation',
  submitLabel,
}: FormBodyProps<TValues>) => {
  const submitForm = useSubmitForm<TValues>();
  const navigation = useNavigation();
  const fetcher = useFetcher();

  const isFetcherSubmission = submission === 'fetcher';
  const isSubmitting = isFetcherSubmission
    ? fetcher.state !== 'idle'
    : navigation.state === 'submitting' &&
      navigation.formData?.get('formId') === formId;

  const FormComponent = isFetcherSubmission ? fetcher.Form : RouterForm;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!submitForm({ leafFields })) {
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
      {/*  TODO: The fields should be gotten in the FormFields componenet directly using a selector , following the store context pattern,  */}
      <FormFields fields={fields} />
      <FormBodyFooter
        cancelLabel={cancelLabel}
        cancelTo={cancelTo}
        isSubmitting={isSubmitting}
        leafFields={leafFields}
        submitLabel={submitLabel}
      >
        {children}
      </FormBodyFooter>
    </FormComponent>
  );
};
