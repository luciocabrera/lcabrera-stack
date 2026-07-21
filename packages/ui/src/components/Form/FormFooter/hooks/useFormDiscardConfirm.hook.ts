import { useGetFormCancelTo } from '@lcabrera/ui/components/Form/contexts/FormContext/selectors';
import { useBackNavigate } from '@lcabrera/ui/hooks';
import { useState } from 'react';

/**
 * Owns the form's discard-changes confirmation flow: tracks whether the confirm
 * dialog is open and exposes the cancel-click / accept / dismiss handlers.
 * Cancelling with a dirty form opens the dialog; cancelling a clean form (or
 * accepting the dialog) navigates back to the form's cancel route.
 */
export const useFormDiscardConfirm = () => {
  const cancelTo = useGetFormCancelTo();
  const goBack = useBackNavigate();
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  const handleCancelClick = (isDirty: boolean) => {
    if (isDirty) {
      setIsConfirmDiscardOpen(true);
      return;
    }

    goBack(cancelTo);
  };

  const handleAcceptConfirm = () => {
    setIsConfirmDiscardOpen(false);
    goBack(cancelTo);
  };

  const handleCancelConfirm = () => {
    setIsConfirmDiscardOpen(false);
  };

  return {
    handleAcceptConfirm,
    handleCancelClick,
    handleCancelConfirm,
    isConfirmDiscardOpen,
  };
};
