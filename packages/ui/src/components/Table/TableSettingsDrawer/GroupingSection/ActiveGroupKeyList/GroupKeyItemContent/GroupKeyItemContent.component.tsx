import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { MenuCloseIcon } from '#ui/components/Icons';
import { useGetTableIsGroupingLocked } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { GroupKeyItemContentProps } from './GroupKeyItemContent.types';

import { GroupKeyPeriodSelect } from '../GroupKeyPeriodSelect';
import { styles } from './GroupKeyItemContent.stylex';

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
