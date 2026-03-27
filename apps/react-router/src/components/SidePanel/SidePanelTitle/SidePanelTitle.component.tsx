import * as stylex from "@stylexjs/stylex";

import type { SidePanelTitleProps } from "./SidePanelTitle.types.ts";

import { sidePanelTitleStyles } from "./SidePanelTitle.stylex.ts";

export const SidePanelTitle = ({ children, icon, ...props }: SidePanelTitleProps) => {
  return (
    <h2 data-testid="side-panel-title" {...props} {...stylex.props(sidePanelTitleStyles.title)}>
      {icon && <span {...stylex.props(sidePanelTitleStyles.icon)}>{icon}</span>}
      {children}
    </h2>
  );
};
