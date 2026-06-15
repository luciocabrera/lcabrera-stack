export type SidePanelHeaderToolbarProps = {
  readonly isBusy?: boolean;
  readonly isPinned: boolean;
  readonly onClose: () => void;
  readonly onTogglePin: () => void;
};
