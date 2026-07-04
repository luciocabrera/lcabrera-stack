import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to cancel the pin conflict modal.
 */
export const useCancelPinConflict = () => {
  const { modalsStore } = useColumnOrderSectionContextValue();

  return () => {
    const conflictModal = modalsStore.get()?.conflictModal;
    if (!conflictModal) return;

    modalsStore.set({
      conflictModal: { ...conflictModal, isOpen: false },
    });
  };
};
