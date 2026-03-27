import * as stylex from "@stylexjs/stylex";

import type { SidePanelSectionOverlayProps } from "./SidePanelSectionOverlay.types.ts";

import { styles } from "./SidePanelSectionOverlay.stylex.ts";

export const SidePanelSectionOverlay = ({ children, isOpen }: SidePanelSectionOverlayProps) => (
  <div {...stylex.props(styles.restArea, isOpen && styles.restAreaOverflowHidden)}>
    {isOpen && <div {...stylex.props(styles.overlay)} />}
    {children}
  </div>
);
