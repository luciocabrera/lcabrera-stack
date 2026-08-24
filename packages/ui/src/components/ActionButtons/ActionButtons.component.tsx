import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';

import type { ActionButtonsProps } from './ActionButtons.types';

import { styles } from './ActionButtons.stylex';

export const ActionButtons = ({
  actions,
  customStylex,
  isBusy = false,
  ...props
}: ActionButtonsProps) => (
  <div
    data-testid='action-buttons'
    {...props}
    {...stylex.props(styles.container, customStylex)}
  >
    {actions.map(({ key, label, onClick, ...buttonProps }) => (
      <Button
        isBusy={isBusy}
        key={key ?? label}
        onClick={onClick}
        {...buttonProps}
      >
        {label}
      </Button>
    ))}
  </div>
);
