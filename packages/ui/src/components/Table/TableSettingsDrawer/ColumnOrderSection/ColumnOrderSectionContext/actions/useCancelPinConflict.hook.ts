import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

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
