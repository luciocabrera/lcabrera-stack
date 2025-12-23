import * as stylex from '@stylexjs/stylex';

import type { CardFooterProps } from './CardFooter.types';

import { cardFooterStyles } from './CardFooter.stylex';

export const CardFooter = ({ children, ...props }: CardFooterProps) => {
  return (
    <div data-testid="card-footer" {...props} {...stylex.props(cardFooterStyles.footer)}>
      {children}
    </div>
  );
};
