import * as stylex from '@stylexjs/stylex';

import type { SidePanelFooterProps } from './SidePanelFooter.types';

import { sidePanelFooterStyles } from './SidePanelFooter.stylex';

export const SidePanelFooter = ({ children, ...props }: SidePanelFooterProps) => {
  return (
    <div
      data-testid='side-panel-footer'
      {...props}
      {...stylex.props(sidePanelFooterStyles.footer)}
    >
      {children}
    </div>
  );
};
