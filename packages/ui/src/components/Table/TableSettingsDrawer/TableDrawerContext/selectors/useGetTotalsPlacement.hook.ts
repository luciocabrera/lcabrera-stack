import { useTotalsPlacementStore } from '../useTotalsPlacementStore.hook';

/** Where the staged configuration would put each total. */
export const useGetTotalsPlacement = () =>
  useTotalsPlacementStore((state) => state.totalsPlacement);
