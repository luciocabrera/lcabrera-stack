import * as stylex from '@stylexjs/stylex';

import type { CardDescriptionProps } from './CardDescription.types.ts';

import { cardDescriptionStyles } from './CardDescription.stylex.ts';

export const CardDescription = ({
  children,
  ...props
}: CardDescriptionProps) => {
  return (
    <p
      data-testid='card-description'
      {...props}
      {...stylex.props(cardDescriptionStyles.description)}
    >
      {children}
    </p>
  );
};
