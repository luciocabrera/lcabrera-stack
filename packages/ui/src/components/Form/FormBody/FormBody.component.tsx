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

  const FormComponent = isFetcherSubmission ? fetcher.Form : RouterForm;
  const isSubmitDisabled = isSubmitting || (mode === 'edit' && !isDirty);

  return (
    // noValidate: leaf inputs still carry native required/min/max for a11y,
    // but native constraint validation would otherwise block the submit
    // event entirely before handleSubmit/preventDefault ever runs.
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
            color='ghost'
            onClick={handleCancelClick}
            type='button'
            variant='flat'
          >
            {cancelLabel}
          </Button>
          {children}
          <Button
            color='primary'
            isBusy={isSubmitting}
            isDisabled={isSubmitDisabled}
            type='submit'
            variant='solid'
          >
            {submitLabel}
          </Button>
        </div>
      )}
      <ConfirmDialog
        cancelLabel='Keep Editing'
        confirmLabel='Discard Changes'
        description='You have unsaved changes. Leaving now will lose them.'
        isOpen={isConfirmDiscardOpen}
        onCancel={() => setIsConfirmDiscardOpen(false)}
        onConfirm={() => {
          setIsConfirmDiscardOpen(false);
          goBack(cancelTo);
        }}
        title='Discard changes?'
      />
    </FormComponent>
  );
};
