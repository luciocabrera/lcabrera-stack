import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { MenuCloseIcon } from '#ui/components/Icons';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { GroupKeyItemContentProps } from './GroupKeyItemContent.types';

import { styles } from './GroupKeyItemContent.stylex';

/**
 * One applied group key in the drawer list: its level, its column label, and a
 * remove control.
 *
 * The level is shown because the order of this list is not cosmetic — it is the
 * grouped query's nesting order, so a user dragging an item is changing which
 * question the table answers.
 */
export const GroupKeyItemContent = ({
  isBusy,
  item,
  level,
  onRemove,
}: GroupKeyItemContentProps) => {
  const handleRemove = () => {
    onRemove(item.columnKey);
  };

  return (
    <div {...stylex.props(styles.groupKeyItem)}>
      <span {...stylex.props(styles.groupKeyItemLabel)}>
        {`${level}. ${item.label}`}
      </span>
      <div {...stylex.props(styles.groupKeyItemControls)}>
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
    </div>
  );
};
