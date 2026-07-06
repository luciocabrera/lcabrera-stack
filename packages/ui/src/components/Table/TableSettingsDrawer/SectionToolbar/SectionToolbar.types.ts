import type { IconProps } from '@repo/ui/components/Icons';
import type { ComponentType } from 'react';

export type SectionToolbarButton = {
  /** Icon component rendered at the variant-resolved icon size */
  readonly icon: ComponentType<IconProps>;
  /** Whether the button is disabled */
  readonly isDisabled?: boolean;
  /** Stable React key + aria label + tooltip source */
  readonly key: string;
  /** Visible label (footer) and tooltip/aria text (toolbar) */
  readonly label: string;
  /** Click handler */
  readonly onClick?: () => void;
};

export type SectionToolbarProps = {
  /** Buttons rendered in declared order */
  readonly buttons: readonly SectionToolbarButton[];
  /** Whether buttons render in busy state */
  readonly isBusy?: boolean;
  /** Display variant: 'footer' for full-width buttons, 'toolbar' for mini icon-only buttons */
  readonly variant?: 'footer' | 'toolbar';
};
