import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { formInputStyles } from '#ui/components/Form/fields/formInput.stylex';
import { Text } from '#ui/components/Text';
import { controlSizeVariants } from '#ui/design-system/tokens/commons.stylex';

import type { SelectProps } from './Select.types';

export const Select = ({
  customStylex,
  id,
  label,
  options,
  size,
  ...rest
}: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const select = (
    <select
      {...rest}
      id={selectId}
      {...stylex.props(
        formInputStyles.input,
        formInputStyles.select,
        size && controlSizeVariants[size],
        customStylex,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (label === undefined) return select;

  return (
    <div {...stylex.props(formInputStyles.field)}>
      <Text as='label' htmlFor={selectId} size='sm' weight='medium'>
        {label}
      </Text>
      {select}
    </div>
  );
};
