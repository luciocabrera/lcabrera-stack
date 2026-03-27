import * as stylex from "@stylexjs/stylex";

import type { CardHeaderProps } from "./CardHeader.types.ts";

import { cardHeaderStyles } from "./CardHeader.stylex.ts";

export const CardHeader = ({ children, ...props }: CardHeaderProps) => {
  return (
    <div data-testid="card-header" {...props} {...stylex.props(cardHeaderStyles.header)}>
      {children}
    </div>
  );
};
