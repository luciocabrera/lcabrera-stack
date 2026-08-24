import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

/**
 * What one column may do in a grouped read, as the catalogue answered it (ADR-058) and the
 * loader shipped it (ADR-063), or `undefined` when this route resolved no capability for
 * it.
 * A route that declares no grouping resolves none at all, so an absent answer is the
 * common case rather than an error state — but **the two questions read absence in
 * opposite directions, and each is right about its own**: - *Which aggregates may this
 * column take?* `undefined` is "nothing is legal here", never "everything is".
 */
export const useGetTableColumnGroupingCapability = (columnKey: string) =>
  useMetaStore((state) => state.groupingCapabilities?.[columnKey]);
