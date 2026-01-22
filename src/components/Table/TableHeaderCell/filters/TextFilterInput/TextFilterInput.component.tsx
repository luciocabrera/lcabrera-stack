import * as stylex from '@stylexjs/stylex';
import { useMemo, useState } from 'react';

import type { TextFilterInputProps } from './TextFilterInput.types';

import { styles } from './TextFilterInput.stylex';

export const TextFilterInput = ({
  filter,
  onChange,
  operator,
}: TextFilterInputProps) => {
  const initialValue = useMemo(() => filter?.value ?? '', [filter?.value]);
  const [value, setValue] = useState(initialValue);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    if (newValue) {
      onChange({ operator, type: 'text', value: newValue });
    } else {
      onChange();
    }
  };

  return (
    <div {...stylex.props(styles.container)}>
      <input
        onChange={(e) => {
          handleValueChange(e.target.value);
        }}
        placeholder='Enter text...'
        type='text'
        value={value}
        {...stylex.props(styles.input)}
      />
    </div>
  );
};
