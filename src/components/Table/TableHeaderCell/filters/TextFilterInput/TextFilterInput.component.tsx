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
        autoComplete="off"
        data-1p-ignore="true"
        data-bwignore="true"
        data-form-type="other"
        data-lpignore="true"
        data-np-checked="1"
        data-np-ignore="1"
        name={`filter-text-${Math.random().toString(36).substring(7)}`}
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
