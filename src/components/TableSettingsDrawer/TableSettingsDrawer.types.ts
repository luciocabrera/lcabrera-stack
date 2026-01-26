export type TableSettingsDrawerProps = {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Whether the drawer is pinned (stays open) */
  isPinned?: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Callback when pin state changes */
  onPinChange?: (isPinned: boolean) => void;
};
