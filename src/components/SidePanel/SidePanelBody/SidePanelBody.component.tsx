import * as stylex from '@stylexjs/stylex';

import type { SidePanelBodyProps } from './SidePanelBody.types';

import { sidePanelBodyStyles } from './SidePanelBody.stylex';

export const SidePanelBody = ({ children, ...props }: SidePanelBodyProps) => {
  return (
    <div
      data-testid='side-panel-body'
      {...props}
      {...stylex.props(sidePanelBodyStyles.body)}
    >
      {children}
    </div>
  );
};
