import * as stylex from '@stylexjs/stylex';

import type { CardBodyProps } from './CardBody.types.ts';

import { cardBodyStyles } from './CardBody.stylex.ts';

export const CardBody = ({ children, ...props }: CardBodyProps) => {
  return (
    <div
      data-testid='card-body'
      {...props}
      {...stylex.props(cardBodyStyles.body)}
    >
      {children}
    </div>
  );
};
