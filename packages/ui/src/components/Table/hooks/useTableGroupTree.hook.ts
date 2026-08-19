import { useGetTableCollapsedGroupPaths } from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { resolveTableGroupTree } from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { useGetTableIsGroupDrillEnabled } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';

/**
 * The rows the body paints and what each of them is in the tree — the one
 * derivation the grid element, the virtualization window and the row loop all
 * read (ADR-067).
 *
 * It is composed from two selectors rather than being one, deliberately. A
 * selector passed to `useSyncExternalStore` is called on every check and must
 * return a stable value for an unchanged store; this derivation allocates, so
 * written as a selector it would report a change on every render and never
 * settle. Selecting the two stable inputs and deriving outside keeps that
 * property, and the React Compiler memoizes the result on them (ADR-004).
 */
export const useTableGroupTree = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>() => {
  const data = useGetTableData<TData>();
  const collapsedGroupPaths = useGetTableCollapsedGroupPaths();
  const groupingKeys = useGetTableGroupingKeys();
  const canDrill = useGetTableIsGroupDrillEnabled();

  return resolveTableGroupTree({
    canDrill,
    collapsedGroupPaths,
    data,
    groupingKeys,
  });
};
