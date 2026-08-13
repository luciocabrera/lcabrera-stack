import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

/**
 * What one column may do in a grouped read, as the catalogue answered it
 * (ADR-058) and the loader shipped it (ADR-063), or `undefined` when this route
 * resolved no capability for it.
 *
 * `undefined` reads as "nothing is legal here", never as "everything is". A
 * route that declares no grouping resolves none at all, so an absent answer is
 * the common case rather than an error state.
 */
export const useGetTableColumnGroupingCapability = (columnKey: string) =>
  useMetaStore((state) => state.groupingCapabilities?.[columnKey]);
