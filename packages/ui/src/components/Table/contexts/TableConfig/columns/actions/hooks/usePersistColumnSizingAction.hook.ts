import { buildColumnSizingCookieEntry } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

/**
 * Persists whatever column widths are currently in the store to the cookie, via the
 * `/_action/persist-cookie` server action (`Set-Cookie`).
 * Replaces the old client-side `document.cookie` write: the cookie is still the only
 * channel the SSR loader can read, so the width saved here is the width the next document
 * paints with.
 */
export const usePersistColumnSizingAction = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistCookie = usePersistCookieAction({
    fetcherKey: 'persist-column-sizing',
  });

  return () => {
    const metaState = metaStore.get();

    // A transient layout is not seeded from the cookie, so a width written here
    // would be carried on every request and read by nobody.
    if (metaState?.isColumnLayoutTransient === true) return;

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
