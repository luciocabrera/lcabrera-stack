import { Button } from '@repo/ui/components/Button';
import { ConfirmDialog } from '@repo/ui/components/ConfirmDialog';
import {
  useGetFormMode,
  useGetIsFormDirty,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import { useBackNavigate } from '@repo/ui/hooks';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { FormBodyFooterProps } from './FormBodyFooter.types';

import { styles } from '../FormBody.stylex';

/**
 * Footer of the form body: submit/cancel buttons plus the discard-changes
 * confirmation flow. Owns its store wiring: reads the form mode and dirty
 * state itself and holds the confirm-discard dialog state; only the
 * submission flag (shell-owned fetcher/navigation state) comes in as a prop.
 * Renders nothing in view mode.
 */
export const FormBodyFooter = <TValues extends Record<string, unknown>>({
  cancelLabel = 'Cancel',
  cancelTo,
  children,
  isSubmitting,
  leafFields,
  submitLabel = 'Accept',
}: FormBodyFooterProps<TValues>) => {
  const mode = useGetFormMode();
  const isDirty = useGetIsFormDirty<TValues>(
    leafFields.map((field) => field.accessor),
  );
  const goBack = useBackNavigate();
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  if (mode === 'view') {
    return;
  }

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
