export type SortingSectionToolbarProps = {
  /** Whether toolbar buttons should render in busy state */
  readonly isBussy?: boolean;
  /** Display variant: 'footer' for full-width buttons, 'toolbar' for mini icon-only buttons */
  readonly variant?: 'footer' | 'toolbar';
};
