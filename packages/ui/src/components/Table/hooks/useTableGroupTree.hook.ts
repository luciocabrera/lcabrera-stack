import { useGetTableCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { resolveTableGroupTree } from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';

export const useTableGroupTree = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>() => {
  const data = useGetTableData<TData>();
  const collapsedGroupPaths = useGetTableCollapsedGroupPaths();

  return resolveTableGroupTree({ collapsedGroupPaths, data });
};
