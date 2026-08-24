import { useColumnDrawerContextValue } from '#ui/components/Table/ColumnSettingsDrawer/ColumnDrawerContext/useColumnDrawerContextValue.hook';

/**
 * Deliberately named apart from the live
 * `contexts/TableConfig/columns/actions/useSetColumnSizing` hook, which writes table state
 * and rewrites the cookie immediately.
 * The two share a concept but have opposite commit semantics; the `Draft` prefix keeps the
 * staged one unmistakable at the call site.
 */
export const useSetDraftColumnSizing = () => {
  const { columnStore } = useColumnDrawerContextValue();

  return (columnSizing?: number) => {
    columnStore.set({ columnSizing });
  };
};
