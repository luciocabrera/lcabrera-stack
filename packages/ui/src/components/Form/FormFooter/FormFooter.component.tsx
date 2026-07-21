import { ConfirmDialog } from '@lcabrera/ui/components/ConfirmDialog';
import { useGetFormMode } from '@lcabrera/ui/components/Form/contexts/FormContext/selectors';

import type { FormFooterProps } from './FormFooter.types';

import { FormFooterActions } from './FormFooterActions';
import { useFormDiscardConfirm } from './hooks';

/**
 * Footer of the form body: submit/cancel buttons plus the discard-changes
 * confirmation flow. Fully self-connected: reads the mode, dirty state,
 * labels, and cancel route from the form stores, and derives the submission
 * flag itself from the formId-keyed fetcher or the navigation state. Renders
 * nothing in view mode.
 */
export const FormFooter = ({ children }: FormFooterProps) => {
  const mode = useGetFormMode();
  const {
    handleAcceptConfirm,
    handleCancelClick,
    handleCancelConfirm,
    isConfirmDiscardOpen,
  } = useFormDiscardConfirm();

  if (mode === 'view') {
    return;
  }

  return (
    <>
      <FormFooterActions onCancelClick={handleCancelClick}>
        {children}
      </FormFooterActions>
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
