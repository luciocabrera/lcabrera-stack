import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { MenuCloseIcon } from '#ui/components/Icons';
import { useGetTableIsGroupingLocked } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { GroupKeyItemContentProps } from './GroupKeyItemContent.types';

import { GroupKeyPeriodSelect } from '../GroupKeyPeriodSelect';
import { styles } from './GroupKeyItemContent.stylex';

/**
 * A temporal key also carries a granularity control, which renders itself away on every
 * other column (#786).
 * It sits here rather than in the add-key control above because a granularity is a
 * property of an **applied** key: it is chosen, changed and read back long after the key
 * was added.
 */
export const GroupKeyItemContent = ({
  isBusy,
  item,
  level,
  onRemove,
}: GroupKeyItemContentProps) => {
  const isGroupingLocked = useGetTableIsGroupingLocked();

  const handleRemove = () => {
    onRemove(item.columnKey);
  };

  return (
    <div {...stylex.props(styles.groupKeyItem)}>
      <span {...stylex.props(styles.groupKeyItemLabel)}>
        {`${level}. ${item.label}`}
      </span>
      {/*
       * Under a lock the row still says which column it groups by and at which
       * level — the grouping is rendered, only the edits are gone (#578). The
       * granularity goes with the remove control because it reshapes the key
       * rather than describing it.
       */}
      {!isGroupingLocked && (
        <div {...stylex.props(styles.groupKeyItemControls)}>
          <GroupKeyPeriodSelect
            columnKey={item.columnKey}
            isBusy={isBusy}
            label={item.label}
          />
          <Button
            aria-label={`Remove ${item.label} group key`}
            icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={handleRemove}
            size='mini'
            tooltipContent={`Remove ${item.label} group key`}
            variant='ghost'
          />
        </div>
      )}
    </div>
  );
};
