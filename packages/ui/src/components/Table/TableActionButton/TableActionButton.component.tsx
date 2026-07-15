import { Button } from '@repo/ui/components/Button';
import { MoreVerticalIcon } from '@repo/ui/components/Icons';

import type { TableActionButtonProps } from './TableActionButton.types';

export const TableActionButton = ({
  ariaLabel,
  isDisabled = false,
  label,
  menuId,
  onClick,
  triggerId,
}: TableActionButtonProps) => {
  return (
    <Button
      aria-label={ariaLabel}
      variant='ghost'
      data-menu-id={menuId}
      icon={<MoreVerticalIcon size={14} />}
      id={triggerId}
      isDisabled={isDisabled}
      onClick={onClick}
      size='embedded'
    >
      {label}
    </Button>
  );
};
