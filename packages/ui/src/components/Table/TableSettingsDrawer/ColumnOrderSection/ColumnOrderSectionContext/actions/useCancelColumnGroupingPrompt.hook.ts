import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

export const useCancelColumnGroupingPrompt = () => {
  const { modalsStore } = useColumnOrderSectionContextValue();

  return () => {
    modalsStore.set({
      columnGroupingPrompt: { columnKey: '', isOpen: false },
    });
  };
};
