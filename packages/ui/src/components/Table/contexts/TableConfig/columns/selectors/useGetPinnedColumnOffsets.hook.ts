import { useGetColumnViewState } from './useGetColumnViewState.hook';

export const useGetPinnedColumnOffsets = () =>
  useGetColumnViewState().pinnedColumnOffsets;
