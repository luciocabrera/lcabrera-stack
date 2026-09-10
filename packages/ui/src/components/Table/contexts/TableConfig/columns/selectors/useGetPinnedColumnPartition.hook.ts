import { useGetColumnViewState } from './useGetColumnViewState.hook';

export const useGetPinnedColumnPartition = () =>
  useGetColumnViewState().pinnedColumnPartition;
