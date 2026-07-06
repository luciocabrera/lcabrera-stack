import { Button } from '@repo/ui/components/Button';
import { MoreVerticalIcon } from '@repo/ui/components/Icons';

import type { TableActionButtonProps } from './TableActionButton.types';

export const TableActionButton = ({ menuId }: TableActionButtonProps) => {
  return (
    <Button
      aria-label='Row actions'
      color='ghost'
      icon={<MoreVerticalIcon size={14} />}
      popoverTarget={menuId}
      popoverTargetAction='toggle'
      size='embedded'
      width='auto'
    >
      Row actions
    </Button>
  );
};
