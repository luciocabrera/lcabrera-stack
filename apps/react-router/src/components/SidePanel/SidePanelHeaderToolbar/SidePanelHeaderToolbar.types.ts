export type SidePanelHeaderToolbarProps = {
  readonly isBussy?: boolean;
  readonly isPinned: boolean;
  readonly onClose: () => void;
  readonly onTogglePin: () => void;
};
