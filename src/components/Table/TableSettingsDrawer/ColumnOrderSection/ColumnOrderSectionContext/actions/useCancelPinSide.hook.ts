import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

/**
 * Hook to cancel the pin side selection modal.
 */
export const useCancelPinSide = () => {
  const { modalsStore } = useColumnOrderSectionContextValue();

  return () => {
    const pinSideModal = modalsStore.get()?.pinSideModal;
    if (!pinSideModal) return;

    modalsStore.set({
      pinSideModal: { ...pinSideModal, isOpen: false },
    });
  };
};
