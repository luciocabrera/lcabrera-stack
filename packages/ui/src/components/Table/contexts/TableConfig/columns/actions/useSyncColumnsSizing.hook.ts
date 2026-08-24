import { usePersistColumnSizingAction } from './hooks/usePersistColumnSizingAction.hook';

export const useSyncColumnsSizing = <TData>() => {
  const persistColumnSizing = usePersistColumnSizingAction<TData>();

  return () => {
    persistColumnSizing();
  };
};
