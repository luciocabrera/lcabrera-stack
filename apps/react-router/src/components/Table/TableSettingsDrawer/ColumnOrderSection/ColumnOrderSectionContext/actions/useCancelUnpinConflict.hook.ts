import { useColumnOrderSectionContextValue } from "../useColumnOrderSectionContextValue.hook.ts";

/**
 * Hook to cancel the unpin conflict modal.
 */
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
