import * as stylex from '@stylexjs/stylex';

import type { ToolbarButtonItemProps } from '../Toolbar.types';

import { Button } from '../../Button';
import { styles } from './ToolbarButtonItem.stylex';

export const ToolbarButtonItem = ({
  color = 'ghost',
  icon,
  isDisabled,
  label,
  size = 'md',
  ...props
}: ToolbarButtonItemProps) => {
  return (
    <Button
      color={color}
      isDisabled={isDisabled}
      size={size}
      type='button'
      width='full'
      {...props}
    >
      {icon && <span {...stylex.props(styles.itemIcon)}>{icon}</span>}
      <span {...stylex.props(styles.itemLabel)}>{label}</span>
    </Button>
  );
};
