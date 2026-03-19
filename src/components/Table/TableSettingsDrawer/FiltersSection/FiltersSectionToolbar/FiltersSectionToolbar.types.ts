export type FiltersSectionToolbarProps = {
  /** Optional callback for additional cleanup when clearing (e.g. resetting local UI state) */
  onClearAll?: () => void;
  /** Display variant: 'footer' for full-width buttons, 'toolbar' for mini icon-only buttons */
  variant?: 'footer' | 'toolbar';
};
