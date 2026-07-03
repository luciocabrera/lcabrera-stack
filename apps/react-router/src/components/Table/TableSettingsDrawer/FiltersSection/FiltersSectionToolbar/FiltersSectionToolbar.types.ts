import type { ReactNode } from 'react';

export type FiltersSectionToolbarProps = {
  /** Whether buttons should render in busy state */
  readonly isBusy?: boolean;
  /** Disable the collapse-all action button */
  readonly isCollapseAllDisabled?: boolean;
  /** Disable the expand-all action button */
  readonly isExpandAllDisabled?: boolean;
  /** Optional callback for additional cleanup when clearing (e.g. resetting local UI state) */
  readonly onClearAll?: () => void;
  /** Optional callback for collapsing all filter items */
  readonly onCollapseAll?: () => void;
  /** Optional callback for expanding all filter items */
  readonly onExpandAll?: () => void;
  /** Display variant: 'footer' for full-width buttons, 'toolbar' for mini icon-only buttons */
  readonly variant?: 'footer' | 'toolbar';
};

export type FiltersToolbarButton = {
  /** Icon element rendered inside the button */
  readonly icon: ReactNode;
  /** Whether the button is disabled */
  readonly isDisabled?: boolean;
  /** Stable React key + aria label source */
  readonly key: string;
  /** Visible label (footer) and tooltip/aria text (toolbar) */
  readonly label: string;
  /** Click handler */
  readonly onClick?: () => void;
};
