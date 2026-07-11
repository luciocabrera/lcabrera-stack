import type { FormEvent } from 'react';

import { Button } from '@repo/ui/components/Button';
import { ConfirmDialog } from '@repo/ui/components/ConfirmDialog';
import { useSubmitForm } from '@repo/ui/components/Form/contexts/FormContext/actions';
import {
  useGetFormMode,
  useGetIsFormDirty,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { FormFields } from '@repo/ui/components/Form/FormFields/FormFields.component';
import { useBackNavigate } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { Form as RouterForm, useFetcher, useNavigation } from 'react-router';

import type { FormBodyProps } from './FormBody.types';

import { styles } from './FormBody.stylex';

export const FormBody = <TValues extends Record<string, unknown>>({
  action,
  cancelLabel = 'Cancel',
  cancelTo,
  children,
  fields,
  formId,
  leafFields,
  method = 'post',
  submission = 'navigation',
  submitLabel = 'Accept',
}: FormBodyProps<TValues>) => {
  const mode = useGetFormMode();
  const isDirty = useGetIsFormDirty<TValues>(
    leafFields.map((field) => field.accessor),
  );
  const submitForm = useSubmitForm<TValues>();
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const goBack = useBackNavigate();
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  const isFetcherSubmission = submission === 'fetcher';
  const isSubmitting = isFetcherSubmission
    ? fetcher.state !== 'idle'
    : navigation.state === 'submitting' &&
      navigation.formData?.get('formId') === formId;

  const FormComponent = isFetcherSubmission ? fetcher.Form : RouterForm;
  const isSubmitDisabled = isSubmitting || (mode === 'edit' && !isDirty);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!submitForm({ leafFields })) {
      event.preventDefault();
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setIsConfirmDiscardOpen(true);
    } else {
      goBack(cancelTo);
    }
  };

  const handleAcceptConfirm = () => {
    setIsConfirmDiscardOpen(false);
    goBack(cancelTo);
  };

  const handleCancelConfirm = () => setIsConfirmDiscardOpen(false);

  return (
    <FormComponent
      action={action}
      method={method}
      noValidate
      onSubmit={handleSubmit}
      {...stylex.props(styles.form)}
    >
      <input name='formId' type='hidden' value={formId} />
      <FormFields fields={fields} />
      {mode !== 'view' && (
        <div {...stylex.props(styles.footer)}>
          <Button
            color='primary'
            isBusy={isSubmitting}
            isDisabled={isSubmitDisabled}
            type='submit'
          >
            {submitLabel}
          </Button>
          <Button color='outline' onClick={handleCancelClick}>
            {cancelLabel}
          </Button>
          {children}
        </div>
      )}
      {/* Stays mounted — Modal owns the native dialog lifecycle via isOpen
          (ADR-001), so closing keeps the <dialog> in the DOM with open=false */}
      <ConfirmDialog
        cancelLabel='Keep Editing'
        confirmLabel='Discard Changes'
        description='You have unsaved changes. Leaving now will lose them.'
        isOpen={isConfirmDiscardOpen}
        onCancel={handleCancelConfirm}
        onConfirm={handleAcceptConfirm}
        title='Discard changes?'
      />
    </FormComponent>
  );
};
