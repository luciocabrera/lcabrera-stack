import { Form } from 'react-router';

import { Button } from '#ui/components/Button';
import { useGetAppLogoutRoute } from '#ui/contexts/AppConfigContext/selectors';
import {
  useGetGlobalNavigationCollapsedPreference,
  useGetGlobalNavigationSizePreference,
} from '#ui/contexts/GlobalSettingsContext/selectors';

import { NAV_DENSITY } from '../../AppNavigation.constants';

/**
 * The navigation footer's session controls, rendered only by an app that
 * declared `isAuthEnabled`. Logging out mutates session state, so it POSTs a
 * `<Form>` to the app's logout route rather than linking to it — a GET is
 * something a prefetch can fire on its own. Mirrors the theme toggle beside it:
 * icon-only with a tooltip when the sidebar is collapsed.
 */
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
