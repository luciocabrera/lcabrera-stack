import { Form } from 'react-router';

import { Button } from '#ui/components/Button';
import { useGetAppLogoutRoute } from '#ui/contexts/AppConfigContext/selectors';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationSizePreference,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { NAV_DENSITY } from '../../AppNavigation.constants';

export const NavigationSessionActions = () => {
  const logoutRoute = useGetAppLogoutRoute();
  const navigationCollapsedPreference =
    useGetGlobalNavigationCollapsedPreference();
  const navigationSizePreference = useGetGlobalNavigationSizePreference();

  const isCollapsed = navigationCollapsedPreference === 'collapsed';
  const density = NAV_DENSITY[navigationSizePreference ?? 'medium'];

  return (
    <Form action={logoutRoute} method='post'>
      <Button
        aria-label='Log out'
        icon='🚪'
        isIconOnly={isCollapsed}
        size={density.controlButtonSize}
        tooltipContent={isCollapsed ? 'Log out' : undefined}
        tooltipPlacement='right'
        type='submit'
        variant='ghost'
      >
        Log out
      </Button>
    </Form>
  );
};
