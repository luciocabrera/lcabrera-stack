import { darkTheme } from '@lcabrera/ui/design-system/themes/dark.stylex';
import { lightTheme } from '@lcabrera/ui/design-system/themes/light.stylex';
import { useTheme } from '@lcabrera/ui/hooks/useTheme.hook';
import * as stylex from '@stylexjs/stylex';

import type { AppBackgroundProps } from './AppBackground.types';

import { styles } from './AppBackground.stylex';

export const AppBackground = ({
  children,
  shouldFillViewport = true,
}: AppBackgroundProps) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      {...stylex.props(
        styles.base,
        shouldFillViewport ? styles.viewportHeight : styles.containerHeight,
        isDarkMode ? darkTheme : lightTheme,
      )}
    >
      <div {...stylex.props(styles.backgroundShell, styles.overlayParent)}>
        <div
          {...stylex.props(
            styles.overlay,
            styles.radial,
            styles.backgroundOverlay,
          )}
        />
        {children}
      </div>
    </div>
  );
};
