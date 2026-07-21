import { buildColumnSizingCookieEntry } from '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions/utils';
import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistCookieAction } from '@lcabrera/ui/hooks/usePersistCookieAction.hook';

/**
 * Persists whatever column widths are currently in the store to the cookie, via
 * the `/_action/persist-cookie` server action (`Set-Cookie`). A no-op until the
 * table has a persistence key and a width to save.
 *
 * Replaces the old client-side `document.cookie` write: the cookie is still the
 * only channel the SSR loader can read, so the width saved here is the width the
 * next document paints with. Reads the store rather than taking a width, so it
 * always saves the committed state even when the caller wrote it a moment
 * earlier. Fires only on drag-end (the per-frame path skips persistence).
 */
export const usePersistColumnSizingAction = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistCookie = usePersistCookieAction({
    fetcherKey: 'persist-column-sizing',
  });

  return () => {
    const metaState = metaStore.get();
    const entry = buildColumnSizingCookieEntry<TData>({
      appId: metaState?.appId,
      columnSizing: columnsStore.get()?.columnSizing,
      persistenceKey: metaState?.persistenceKey,
    });

    if (entry) {
      persistCookie([entry]);
    }
  };
};
