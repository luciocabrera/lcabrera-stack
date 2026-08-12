import * as stylex from '@stylexjs/stylex';

import { darkTheme } from '#ui/design-system/themes/dark.stylex';
import { lightTheme } from '#ui/design-system/themes/light.stylex';
import { useTheme } from '#ui/hooks/useTheme.hook';

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
