import { Button } from '@repo/ui/components/Button';
import { SidePanelFooter } from '@repo/ui/components/SidePanel';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationSizePreference,
} from '@repo/ui/contexts/GlobalSettingsContext/selectors';
import * as stylex from '@stylexjs/stylex';

import type { NavigationFooterProps } from './NavigationFooter.types';

import { NAV_DENSITY } from '../AppNavigation.constants';
import { styles } from '../AppNavigation.stylex';
import { resolveThemeLabel } from '../utils';

/**
 * Footer of the navigation sidebar: the theme toggle button, icon-only with
 * a tooltip when the navigation is collapsed and sized by the global density
 * preference.
 */
export const NavigationFooter = ({
  isDarkMode,
  onToggleTheme,
}: NavigationFooterProps) => {
  const navigationCollapsedPreference =
    useGetGlobalNavigationCollapsedPreference();
  const navigationSizePreference = useGetGlobalNavigationSizePreference();

  const isExpanded = navigationCollapsedPreference !== 'collapsed';
  const isCollapsed = !isExpanded;

  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];
  const themeLabel = resolveThemeLabel(isDarkMode);
  const themeTooltipContent = isCollapsed ? themeLabel : undefined;

  return (
    <SidePanelFooter>
      <div {...stylex.props(styles.footer)}>
        <Button
          aria-label={themeLabel}
          icon={isDarkMode ? '☀️' : '🌙'}
          isIconOnly={!isExpanded}
          onClick={onToggleTheme}
          size={density.controlButtonSize}
          tooltipContent={themeTooltipContent}
          tooltipPlacement='right'
          variant='ghost'
        >
          {themeLabel}
        </Button>
      </div>
    </SidePanelFooter>
  );
};
