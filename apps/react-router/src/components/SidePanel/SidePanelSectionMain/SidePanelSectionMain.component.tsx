import * as stylex from '@stylexjs/stylex';

import type { SidePanelSectionMainProps } from './SidePanelSectionMain.types';

import { sidePanelSectionMainStyles } from './SidePanelSectionMain.stylex';

export const SidePanelSectionMain = ({
  children,
  ...props
}: SidePanelSectionMainProps) => {
  return (
    <div
      data-testid='side-panel-section-main'
      {...props}
      {...stylex.props(sidePanelSectionMainStyles.sectionMain)}
    >
      {children}
    </div>
  );
};
