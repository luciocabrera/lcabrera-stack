import { Button } from '#ui/components/Button';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationSizePreference,
} from '#ui/contexts/GlobalSettingsContext/selectors';
import { useTheme } from '#ui/hooks/useTheme.hook';

import { NAV_DENSITY } from '../../AppNavigation.constants';
import { resolveThemeLabel } from '../../utils';

export const NavigationThemeControl = () => {
  const navigationCollapsedPreference =
    useGetGlobalNavigationCollapsedPreference();
  const navigationSizePreference = useGetGlobalNavigationSizePreference();
  const { isDarkMode, toggleTheme } = useTheme();

  const isCollapsed = navigationCollapsedPreference === 'collapsed';
  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];
  const themeLabel = resolveThemeLabel(isDarkMode);

  return (
    <Button
      aria-label={themeLabel}
      icon={isDarkMode ? '☀️' : '🌙'}
      isIconOnly={isCollapsed}
      onClick={toggleTheme}
      size={density.controlButtonSize}
      tooltipContent={isCollapsed ? themeLabel : undefined}
      tooltipPlacement='right'
      variant='ghost'
    >
      {themeLabel}
    </Button>
  );
};
