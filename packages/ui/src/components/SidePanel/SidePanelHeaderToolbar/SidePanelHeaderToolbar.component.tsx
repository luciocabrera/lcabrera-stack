import { Button } from '#ui/components/Button';
import { MenuCloseIcon, PinIcon, PinOffIcon } from '#ui/components/Icons';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { SidePanelHeaderToolbarProps } from './SidePanelHeaderToolbar.types';

export const SidePanelHeaderToolbar = ({
  isBusy = false,
  isPinned,
  onClose,
  onTogglePin,
}: SidePanelHeaderToolbarProps) => {
  const pinButtonTitle = isPinned ? 'Unpin drawer' : 'Pin drawer';

  return (
    <>
      <Button
        aria-label={pinButtonTitle}
        icon={
          isPinned ? (
            <PinIcon size={ICON_SIZE_MD} />
          ) : (
            <PinOffIcon size={ICON_SIZE_MD} />
          )
        }
        isBusy={isBusy}
        onClick={onTogglePin}
        size='mini'
        title={pinButtonTitle}
        variant='ghost'
      />
      <Button
        aria-label='Close drawer'
        icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
        isBusy={isBusy}
        onClick={onClose}
        size='mini'
        title='Close'
        variant='ghost'
      />
    </>
  );
};
