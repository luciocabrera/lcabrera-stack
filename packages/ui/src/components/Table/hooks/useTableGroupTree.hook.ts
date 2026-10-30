import { use } from 'react';

import {
  useGetTableDefaultGroupFold,
  useGetTableToggledGroupPaths,
} from '#ui/components/Table/contexts/TableConfig/expansion/selectors';
import { resolveTableGroupTree } from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { TablePresentationContext } from '#ui/components/Table/contexts/TableConfig/TablePresentationContext.context';
import { useGetTableData } from '#ui/components/Table/contexts/TableData/data/selectors';

import { toStaticGroupTree } from './utils/toStaticGroupTree.util';

export const useTableGroupTree = <
  TData extends Record<string, unknown> = Record<string, unknown>,
>() => {
  const data = useGetTableData<TData>();
  const defaultFold = useGetTableDefaultGroupFold();
  const toggledGroupPaths = useGetTableToggledGroupPaths();
  const { layout } = use(TablePresentationContext);

  return layout === 'static'
    ? toStaticGroupTree(data)
    : resolveTableGroupTree({ data, defaultFold, toggledGroupPaths });
};
