import { useTableGroupLevelFold } from '#ui/components/Table/hooks';

import type { GroupLevelActionsProps } from './GroupLevelActions.types';

import { CollapseGroupLevelButton } from './CollapseGroupLevelButton/CollapseGroupLevelButton.component';
import { ExpandGroupLevelButton } from './ExpandGroupLevelButton/ExpandGroupLevelButton.component';

/**
 * The fold-one-level block, offered only where a fold at this column's level would leave a
 * row standing to undo it — so it is absent on the outermost group key, on a column that
 * is no key at all, and on a `flat` result where nothing is foldable (ADR-083).
 * Withheld rather than disabled, for the reason the aggregation block is: none of those is
 * a state the reader can clear by clicking, so an inert pair would only ask them to keep
 * trying. The block leaves through **one** early return and the two items read only their
 * own enabled state, so they cannot come to disagree about whether it exists at all.
 */
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
