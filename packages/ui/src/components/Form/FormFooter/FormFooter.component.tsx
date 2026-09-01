import { ConfirmDialog } from '#ui/components/ConfirmDialog';
import { useGetFormMode } from '#ui/components/Form/contexts/FormContext/selectors';

import type { FormFooterProps } from './FormFooter.types';

import { FormFooterActions } from './FormFooterActions';
import { useFormDiscardConfirm } from './hooks';

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
