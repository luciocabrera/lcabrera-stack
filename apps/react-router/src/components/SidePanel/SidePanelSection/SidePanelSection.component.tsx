import * as stylex from '@stylexjs/stylex';

import type { SidePanelSectionProps } from './SidePanelSection.types.ts';

import { sidePanelSectionStyles } from './SidePanelSection.stylex.ts';

export const SidePanelSection = ({
  children,
  ...props
}: SidePanelSectionProps) => {
  return (
    <div
      data-testid='side-panel-section'
      {...props}
      {...stylex.props(sidePanelSectionStyles.section)}
    >
      {children}
    </div>
  );
};
