import type { SidePanelHeaderToolbarProps } from './SidePanelHeaderToolbar.types';

import { Button } from '@/components/Button';
import { MenuCloseIcon, PinIcon, PinOffIcon } from '@/components/Icons';
import { ICON_SIZE_MD } from '@/design-system/constants';

export const SidePanelHeaderToolbar = ({
  isBussy = false,
  isPinned,
  onClose,
  onTogglePin,
}: SidePanelHeaderToolbarProps) => {
  const pinButtonTitle = isPinned ? 'Unpin drawer' : 'Pin drawer';

  return (
    <>
      <Button
        aria-label={pinButtonTitle}
        color='ghost'
        icon={
          isPinned ? (
            <PinIcon size={ICON_SIZE_MD} />
          ) : (
            <PinOffIcon size={ICON_SIZE_MD} />
          )
        }
        isBussy={isBussy}
        onClick={onTogglePin}
        size='mini'
        title={pinButtonTitle}
      />
      <Button
        aria-label='Close drawer'
        color='ghost'
        icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
        isBussy={isBussy}
        onClick={onClose}
        size='mini'
        title='Close'
      />
    </>
  );
};
