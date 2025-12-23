import * as stylex from '@stylexjs/stylex';

import type { CardHeaderProps } from './CardHeader.types';

import { cardHeaderStyles } from './CardHeader.stylex';

export const CardHeader = ({ children, ...props }: CardHeaderProps) => {
  return (
    <div data-testid="card-header" {...props} {...stylex.props(cardHeaderStyles.header)}>
      {children}
    </div>
  );
};
