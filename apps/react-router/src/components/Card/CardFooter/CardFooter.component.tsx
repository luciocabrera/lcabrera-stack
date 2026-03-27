import * as stylex from "@stylexjs/stylex";

import type { CardFooterProps } from "./CardFooter.types.ts";

import { cardFooterStyles } from "./CardFooter.stylex.ts";

export const CardFooter = ({ children, ...props }: CardFooterProps) => {
  return (
    <div data-testid="card-footer" {...props} {...stylex.props(cardFooterStyles.footer)}>
      {children}
    </div>
  );
};
