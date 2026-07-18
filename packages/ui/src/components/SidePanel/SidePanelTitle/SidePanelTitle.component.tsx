import * as stylex from '@stylexjs/stylex';

import type { SidePanelTitleProps } from './SidePanelTitle.types';

import { sidePanelTitleStyles } from './SidePanelTitle.stylex';

export const SidePanelTitle = ({
  children,
  icon,
  ...props
}: SidePanelTitleProps) => {
  return (
    <h2
      data-testid='side-panel-title'
      {...props}
      {...stylex.props(sidePanelTitleStyles.title)}
    >
      {Boolean(icon) && (
        <span {...stylex.props(sidePanelTitleStyles.icon)}>{icon}</span>
      )}
      {children}
    </h2>
  );
};
