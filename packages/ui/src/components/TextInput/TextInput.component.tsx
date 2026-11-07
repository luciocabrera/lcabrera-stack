import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import {
  formInputSizeVariants,
  formInputStyles,
} from '#ui/components/Form/fields/formInput.stylex';
import { Text } from '#ui/components/Text';

import type { TextInputProps } from './TextInput.types';

export const TextInput = ({
  customStylex,
  id,
  label,
  size,
  ...rest
}: TextInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const input = (
    <input
      {...rest}
      id={inputId}
      {...stylex.props(
        formInputStyles.input,
        size && formInputSizeVariants[size],
        customStylex,
      )}
    />
  );

  if (label === undefined) return input;

  return (
    <div {...stylex.props(formInputStyles.field)}>
      <Text as='label' htmlFor={inputId} size='sm' weight='medium'>
        {label}
      </Text>
      {input}
    </div>
  );
};
