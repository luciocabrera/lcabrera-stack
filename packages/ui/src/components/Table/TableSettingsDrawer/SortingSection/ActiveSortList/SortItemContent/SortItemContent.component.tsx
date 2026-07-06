import { Button } from '@repo/ui/components/Button';
import {
  MenuCloseIcon,
  SortAscIcon,
  SortDescIcon,
} from '@repo/ui/components/Icons';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

import type { SortItemContentProps } from './SortItemContent.types';

import { styles } from './SortItemContent.stylex';

export const SortItemContent = ({
  isBusy,
  item,
  onRemove,
  onToggleDirection,
}: SortItemContentProps) => {
  const handleRemove = () => {
    onRemove(item.columnKey);
  };
  const handleToggleDirection = () => {
    onToggleDirection(item.columnKey);
  };
  return (
    <div {...stylex.props(styles.sortItem)}>
      <span {...stylex.props(styles.sortItemLabel)}>{item.label}</span>
      <div {...stylex.props(styles.sortItemControls)}>
        <Button
          aria-label={`Sort ${item.label} ${item.direction === 'asc' ? 'ascending' : 'descending'}`}
          color='ghost'
          icon={
            item.direction === 'asc' ? (
              <SortAscIcon size={ICON_SIZE_MD} />
            ) : (
              <SortDescIcon size={ICON_SIZE_MD} />
            )
          }
          isBusy={isBusy}
          onClick={handleToggleDirection}
          size='mini'
          tooltipContent={`Sort ${item.label} ${item.direction === 'asc' ? 'ascending' : 'descending'}`}
        />
        <Button
          aria-label={`Remove ${item.label} sort`}
          color='ghost'
          icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
          isBusy={isBusy}
          onClick={handleRemove}
          size='mini'
          tooltipContent={`Remove ${item.label} sort`}
        />
      </div>
    </div>
  );
};
