import * as stylex from '@stylexjs/stylex';

import type { CardProps } from './Card.types';

import { cardStyles } from './Card.stylex';

export const Card = ({
  children,
  color = 'default',
  elevation = 'sm',
  interactive = 'static',
  padding,
  ...props
}: CardProps) => {
  const isInteractive =
    interactive === 'clickable' || interactive === 'hoverable';

  return (
    <div
      data-testid='card'
      {...props}
      {...stylex.props(
        cardStyles.base,
        cardStyles.elevation[elevation],
        padding && cardStyles.padding[padding],
        cardStyles.color[color],
        isInteractive && cardStyles.rippleBase,
        cardStyles.interactive[interactive],
      )}
    >
      {children}
    </div>
  );
};
