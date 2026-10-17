import type { ReactNode } from 'react';

type MockButtonProps = {
  readonly children: ReactNode;
  readonly isBusy?: boolean;
  readonly isDisabled?: boolean;
  readonly onClick?: () => void;
};

export const MockButton = ({
  children,
  isBusy = false,
  isDisabled = false,
  onClick,
}: MockButtonProps) => (
  <button disabled={isDisabled || isBusy} onClick={onClick} type='button'>
    {children}
  </button>
);
