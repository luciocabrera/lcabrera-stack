import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

export const useCancelUnpinConflict = () => {
  const { modalsStore } = useColumnOrderSectionContextValue();

  return () => {
    const unpinConflictModal = modalsStore.get()?.unpinConflictModal;
    if (!unpinConflictModal) return;

    modalsStore.set({
      unpinConflictModal: { ...unpinConflictModal, isOpen: false },
    });
  };
};
