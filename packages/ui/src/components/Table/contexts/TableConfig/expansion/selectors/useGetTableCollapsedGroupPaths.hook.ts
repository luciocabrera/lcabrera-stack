import { useExpansionStore } from '#ui/components/Table/contexts/TableConfig/expansion/useExpansionStore.hook';

/** The group paths whose subtree is currently hidden. Empty means fully expanded. */
export const useGetTableCollapsedGroupPaths = () =>
  useExpansionStore((state) => state.collapsedGroupPaths);
