import { useGetTableCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { resolveTableGroupTree } from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';

/**
 * The rows the body paints and what each of them is in the tree — the one derivation the
 * grid element, the virtualization window and the row loop all read (ADR-067).
 * It is composed from two selectors rather than being one, deliberately.
 */
export const useTableGroupTree = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>() => {
  const data = useGetTableData<TData>();
  const collapsedGroupPaths = useGetTableCollapsedGroupPaths();

  return resolveTableGroupTree({ collapsedGroupPaths, data });
};
