import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

export const useCancelOrderConflict = () => {
  const { modalsStore } = useColumnOrderSectionContextValue();

  return () => {
    const orderConflict = modalsStore.get()?.orderConflict;
    if (!orderConflict) return;

    modalsStore.set({
      orderConflict: { ...orderConflict, isOpen: false },
    });
  };
};
