import { useTotalsPlacementStore } from '../useTotalsPlacementStore.hook';

export const useGetTotalsPlacement = () =>
  useTotalsPlacementStore((state) => state.totalsPlacement);
