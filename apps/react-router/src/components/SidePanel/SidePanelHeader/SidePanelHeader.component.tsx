import * as stylex from '@stylexjs/stylex';

import type { SidePanelHeaderProps } from './SidePanelHeader.types';

import { sidePanelHeaderStyles } from './SidePanelHeader.stylex';

export const SidePanelHeader = ({
  actions,
  children,
  ...props
}: SidePanelHeaderProps) => {
  return (
    <div
      data-testid='side-panel-header'
      {...props}
      {...stylex.props(sidePanelHeaderStyles.header)}
    >
      <div {...stylex.props(sidePanelHeaderStyles.content)}>
        {children}
        {actions && (
          <div {...stylex.props(sidePanelHeaderStyles.actions)}>{actions}</div>
        )}
      </div>
    </div>
  );
};
