import * as stylex from '@stylexjs/stylex';

import type { SidePanelHeaderProps } from './SidePanelHeader.types';

import { sidePanelHeaderStyles } from './SidePanelHeader.stylex';

export const SidePanelHeader = ({ children, ...props }: SidePanelHeaderProps) => {
  return (
    <div
      data-testid="side-panel-header"
      {...props}
      {...stylex.props(sidePanelHeaderStyles.header)}
    >
      {children}
    </div>
  );
};
