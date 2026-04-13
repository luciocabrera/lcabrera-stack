import * as stylex from '@stylexjs/stylex';

import type { SidePanelBodyProps } from './SidePanelBody.types.ts';

import { sidePanelBodyStyles } from './SidePanelBody.stylex.ts';

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
