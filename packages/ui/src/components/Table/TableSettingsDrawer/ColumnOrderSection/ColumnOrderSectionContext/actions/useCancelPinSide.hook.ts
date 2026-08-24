import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

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
