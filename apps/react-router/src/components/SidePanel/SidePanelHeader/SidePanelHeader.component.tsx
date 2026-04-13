import * as stylex from '@stylexjs/stylex';

import type { SidePanelHeaderProps } from './SidePanelHeader.types.ts';

import { sidePanelHeaderStyles } from './SidePanelHeader.stylex.ts';

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
