import { usePersistColumnSizingAction } from './hooks/usePersistColumnSizingAction.hook';

/**
 * Persists the column widths currently in the store, without changing any.
 *
 * For a caller that has already written a width and only needs it saved — the
 * end of a drag, whose frames went through {@link useSetColumnSizingWithoutSync}.
 * A caller that is both setting and saving a width wants
 * {@link useSetColumnSizing} instead.
 */
export const useSyncColumnsSizing = <TData>() => {
  const persistColumnSizing = usePersistColumnSizingAction<TData>();

  return () => {
    persistColumnSizing();
  };
};
