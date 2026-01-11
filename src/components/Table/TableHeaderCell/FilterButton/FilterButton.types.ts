import type { CustomStylex } from '@/types/design-system.types';

export type FilterButtonProps = {
  /** Custom styles */
  customStylex?: CustomStylex;
  /** Whether the column has an active filter */
  isActive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Popover target ID for HTML Popover API */
  popoverTargetId?: string;
};
