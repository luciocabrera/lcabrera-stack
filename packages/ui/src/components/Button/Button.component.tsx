import type { ButtonProps } from './Button.types';

import { Tooltip } from '../Tooltip';
import { getButtonElement } from './utils';

export const Button = ({
  tooltipContent,
  tooltipPlacement = 'top',
  ...rest
}: ButtonProps) => {
  const button = getButtonElement(rest);

  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} placement={tooltipPlacement}>
        {button}
      </Tooltip>
    );
  }

  return button;
};
