import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnPinning = () =>
  useColumnsStore<'left' | 'right' | undefined>(
    (state) => state.columnPinning,
  );
