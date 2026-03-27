import { useColumnOrderSectionContextValue } from "../useColumnOrderSectionContextValue.hook.ts";

/**
 * Hook to cancel the order conflict modal.
 */
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
