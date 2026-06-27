import * as stylex from '@stylexjs/stylex';

import { CheckIcon } from '@/components/Icons';
import { ICON_SIZE_XXS } from '@/design-system/constants';

import type { CheckboxProps } from './Checkbox.types';

import { styles } from './Checkbox.stylex';

export const Checkbox = ({
  dataTestId,
  isChecked,
  isDisabled = false,
  isReadOnly = false,
  onChange,
  ...props
}: CheckboxProps) => {
  return (
    <span {...stylex.props(styles.container)}>
      <input
        {...props}
        checked={isChecked}
        disabled={isDisabled}
        onChange={onChange}
        readOnly={isReadOnly}
        type='checkbox'
        {...stylex.props(
          styles.input,
          isChecked && styles.inputChecked,
          isDisabled && styles.inputDisabled,
        )}
      />
      {isChecked && (
        <span
          aria-hidden='true'
          data-testid={dataTestId}
          {...stylex.props(styles.iconContainer)}
        >
          <CheckIcon size={ICON_SIZE_XXS} />
        </span>
      )}
    </span>
  );
};
