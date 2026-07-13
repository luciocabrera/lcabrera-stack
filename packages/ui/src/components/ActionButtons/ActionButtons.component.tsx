import { Button } from '@repo/ui/components/Button';
import * as stylex from '@stylexjs/stylex';

import type { ActionButtonsProps } from './ActionButtons.types';

import { styles } from './ActionButtons.stylex';

/**
 * Descriptor-driven row of `Button`s — the shared primitive for modal
 * footers, drawer footers, and settings action rows. Renders one `Button`
 * per action inside a full-width flex container (row, `gap: sm`); pass
 * `customStylex` to adjust layout (direction, justification, gap).
 *
 * Each action defaults to `color='primary'` and `size='sm'` (the dominant
 * combination across consumers) — set either field to override per action.
 * `isBusy` is group-level: it is forwarded to every rendered `Button`.
 */
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
    {actions.map(
      ({
        color = 'primary',
        key,
        label,
        onClick,
        size = 'sm',
        ...buttonProps
      }) => (
        <Button
          color={color}
          isBusy={isBusy}
          key={key ?? label}
          onClick={onClick}
          size={size}
          {...buttonProps}
        >
          {label}
        </Button>
      ),
    )}
  </div>
);
