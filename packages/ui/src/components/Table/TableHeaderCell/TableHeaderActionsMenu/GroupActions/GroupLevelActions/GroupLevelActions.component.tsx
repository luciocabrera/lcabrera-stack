import { useTableGroupLevelFold } from '#ui/components/Table/hooks';

import type { GroupLevelActionsProps } from './GroupLevelActions.types';

import { CollapseGroupLevelButton } from './CollapseGroupLevelButton/CollapseGroupLevelButton.component';
import { ExpandGroupLevelButton } from './ExpandGroupLevelButton/ExpandGroupLevelButton.component';

export const GroupLevelActions = ({
  columnKey,
  onClose,
}: GroupLevelActionsProps) => {
  const { hasGroupLevel } = useTableGroupLevelFold(columnKey);

  if (!hasGroupLevel) return;

  return (
    <>
      <ExpandGroupLevelButton columnKey={columnKey} onClose={onClose} />
      <CollapseGroupLevelButton columnKey={columnKey} onClose={onClose} />
    </>
  );
};
