import type { ReactNode } from 'react';

export type TableActionButtonProps = {
  readonly ariaLabel: string;
  readonly isDisabled?: boolean;
  readonly label: ReactNode;
  readonly menuId: string;
  readonly onClick?: () => void;
  readonly triggerId?: string;
};
