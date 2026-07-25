import { SidePanelFooter } from '@lcabrera/ui/components/SidePanel';
import { useGetIsAuthEnabled } from '@lcabrera/ui/contexts/AppConfigContext/selectors';
import * as stylex from '@stylexjs/stylex';

import { styles } from '../AppNavigation.stylex';
import { NavigationSessionActions } from './NavigationSessionActions/NavigationSessionActions.component';
import { NavigationThemeControl } from './NavigationThemeControl/NavigationThemeControl.component';

/**
 * Footer of the navigation sidebar: the theme toggle, plus the session controls
 * when the app declared it has a session. Composition only — each control reads
 * the collapsed/density preferences it renders with for itself.
 */
export const NavigationFooter = () => {
  const isAuthEnabled = useGetIsAuthEnabled();

  return (
    <SidePanelFooter>
      <div {...stylex.props(styles.footer)}>
        <NavigationThemeControl />
        {isAuthEnabled && <NavigationSessionActions />}
      </div>
    </SidePanelFooter>
  );
};
