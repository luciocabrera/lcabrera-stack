import { useColumnDrawerContextValue } from '../../../useColumnDrawerContextValue.hook';

/**
 * Clears all column settings (filter, sizing, sorting) to undefined.
 */
export const useClearAllColumnSettings = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return () => {
    const columnKey = columnStore.get()?.columnKey;

    if (!columnKey) {
      console.warn(
        '[useClearAllColumnSettings] No columnKey found in column drawer store.',
      );
      return;
    }

    columnStore.set({
      columnFilter: undefined,
      columnKey,
      columnSizing: undefined,
      sorting: undefined,
    });
  };
};
