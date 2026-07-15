import { Button } from '@repo/ui/components/Button';
import { MenuIcon } from '@repo/ui/components/Icons';
import { ICON_SIZE_LG } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

import type { NavigationLauncherProps } from './NavigationLauncher.types';

import { launcherStyles } from './NavigationLauncher.stylex';

/**
 * The narrow fixed-width rail rendered on the left edge when the navigation
 * panel is unpinned. Provides a single button to re-open the panel.
 */
export const NavigationLauncher = ({ onOpen }: NavigationLauncherProps) => {
  return (
    <aside
      aria-label='Navigation launcher'
      {...stylex.props(launcherStyles.launcher)}
    >
      <Button
        aria-label='Open navigation'
        customStylex={launcherStyles.railControl}
        icon={<MenuIcon size={ICON_SIZE_LG} />}
        isIconOnly
        onClick={onOpen}
        size='md'
        tooltipContent='Open navigation'
        tooltipPlacement='right'
        variant='primary'
      >
        Open navigation
      </Button>
    </aside>
  );
};
