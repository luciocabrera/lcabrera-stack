import type { TableLayoutMode } from '../Table.types';

type ResolveTableRoleArgs = {
  readonly isTreeGrid: boolean;
  readonly layout: TableLayoutMode;
};

export const resolveTableRole = ({
  isTreeGrid,
  layout,
}: ResolveTableRoleArgs) => {
  if (layout === 'static') return 'table';

  return isTreeGrid ? 'treegrid' : 'grid';
};
