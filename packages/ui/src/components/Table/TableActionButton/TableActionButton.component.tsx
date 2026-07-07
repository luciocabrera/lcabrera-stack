import { Button } from '@repo/ui/components/Button';
import { MoreVerticalIcon } from '@repo/ui/components/Icons';

import type { TableActionButtonProps } from './TableActionButton.types';

export const TableActionButton = ({
  isDisabled = false,
  menuId,
  onClick,
  triggerId,
}: TableActionButtonProps) => {
  return (
    <Button
      aria-label='Row actions'
      color='ghost'
      data-menu-id={menuId}
      icon={<MoreVerticalIcon size={14} />}
      id={triggerId}
      isDisabled={isDisabled}
      onClick={onClick}
      size='embedded'
      width='auto'
    >
      Row actions
    </Button>
  );
};
