import * as stylex from "@stylexjs/stylex";

import type { SidePanelSectionHeaderProps } from "./SidePanelSectionHeader.types.ts";

import { sidePanelSectionHeaderStyles } from "./SidePanelSectionHeader.stylex.ts";

export const SidePanelSectionHeader = ({
  title,
  toolbar,
  ...props
}: SidePanelSectionHeaderProps) => {
  return (
    <div
      data-testid="side-panel-section-header"
      {...props}
      {...stylex.props(sidePanelSectionHeaderStyles.headerRow)}
    >
      <h3 {...stylex.props(sidePanelSectionHeaderStyles.headerTitle)}>{title}</h3>
      {toolbar}
    </div>
  );
};
