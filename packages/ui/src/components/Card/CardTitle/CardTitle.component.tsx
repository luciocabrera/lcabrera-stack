import * as stylex from '@stylexjs/stylex';

import type { CardTitleProps } from './CardTitle.types';

import { cardTitleStyles } from './CardTitle.stylex';

export const CardTitle = ({ children, icon, ...props }: CardTitleProps) => {
  return (
    <h3
      data-testid='card-title'
      {...props}
      {...stylex.props(cardTitleStyles.title)}
    >
      {Boolean(icon) && (
        <span {...stylex.props(cardTitleStyles.icon)}>{icon}</span>
      )}
      {children}
    </h3>
  );
};
