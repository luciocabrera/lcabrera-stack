import { useState } from 'react';

import { useGetFormCancelTo } from '#ui/components/Form/contexts/FormContext/selectors';
import { useBackNavigate } from '#ui/hooks';

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
