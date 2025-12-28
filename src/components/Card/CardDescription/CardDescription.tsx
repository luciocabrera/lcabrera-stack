import * as stylex from '@stylexjs/stylex';

import type { CardDescriptionProps } from './CardDescription.types';

import { cardDescriptionStyles } from './CardDescription.stylex';

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
