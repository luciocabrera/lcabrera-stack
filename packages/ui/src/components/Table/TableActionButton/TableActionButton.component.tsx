import { Button } from '@lcabrera/ui/components/Button';
import { MoreVerticalIcon } from '@lcabrera/ui/components/Icons';

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
      data-menu-id={menuId}
      icon={<MoreVerticalIcon size={14} />}
      id={triggerId}
      isDisabled={isDisabled}
      onClick={onClick}
      size='embedded'
      variant='ghost'
    >
      {label}
    </Button>
  );
};
