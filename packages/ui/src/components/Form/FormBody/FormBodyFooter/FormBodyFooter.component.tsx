import { Button } from '@repo/ui/components/Button';
import { ConfirmDialog } from '@repo/ui/components/ConfirmDialog';
import {
  useGetFormCancelLabel,
  useGetFormCancelTo,
  useGetFormId,
  useGetFormLeafFields,
  useGetFormMode,
  useGetFormSubmission,
  useGetFormSubmitLabel,
  useGetIsFormDirty,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { useBackNavigate } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { useFetcher, useNavigation } from 'react-router';

import type { FormBodyFooterProps } from './FormBodyFooter.types';

import { styles } from '../FormBody.stylex';

/**
 * Footer of the form body: submit/cancel buttons plus the discard-changes
 * confirmation flow. Fully self-connected: reads the mode, dirty state,
 * labels, and cancel route from the form stores, and derives the submission
 * flag itself from the formId-keyed fetcher or the navigation state. Renders
 * nothing in view mode.
 */
export const FormBodyFooter = ({ children }: FormBodyFooterProps) => {
  const mode = useGetFormMode();
  const formId = useGetFormId();
  const submission = useGetFormSubmission();
  const cancelLabel = useGetFormCancelLabel();
  const submitLabel = useGetFormSubmitLabel();
  const cancelTo = useGetFormCancelTo();
  const leafFields = useGetFormLeafFields();
  const isDirty = useGetIsFormDirty(leafFields.map((field) => field.accessor));
  const goBack = useBackNavigate();
  const navigation = useNavigation();
  const fetcher = useFetcher({ key: formId });
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  if (mode === 'view') {
    return;
  }

  const isSubmitting =
    submission === 'fetcher'
      ? fetcher.state !== 'idle'
      : navigation.state === 'submitting' &&
        navigation.formData?.get('formId') === formId;

  const isSubmitDisabled = isSubmitting || (mode === 'edit' && !isDirty);

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

  const handleCancelConfirm = () => {
    setIsConfirmDiscardOpen(false);
  };

  return (
    <>
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
    </>
  );
};
