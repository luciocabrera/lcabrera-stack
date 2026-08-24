import * as stylex from '@stylexjs/stylex';

import { SidePanelFooter } from '#ui/components/SidePanel';
import { useGetIsAuthEnabled } from '#ui/contexts/AppConfigContext/selectors';

import { styles } from '../AppNavigation.stylex';
import { NavigationSessionActions } from './NavigationSessionActions/NavigationSessionActions.component';
import { NavigationThemeControl } from './NavigationThemeControl/NavigationThemeControl.component';

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
