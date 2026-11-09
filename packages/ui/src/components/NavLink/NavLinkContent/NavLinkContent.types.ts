import type { ReactNode } from 'react';

export type NavLinkContentProps = {
  readonly children: ReactNode;
  readonly icon?: ReactNode;
  readonly isBusy: boolean;
  readonly isIconOnly: boolean;
  readonly isInline: boolean;
};
