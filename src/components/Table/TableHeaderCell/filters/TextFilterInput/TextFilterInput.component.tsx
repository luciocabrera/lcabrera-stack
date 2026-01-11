import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { TextFilterInputProps } from './TextFilterInput.types';

import { styles } from './TextFilterInput.stylex';

export const TextFilterInput = ({ filter, onChange }: TextFilterInputProps) => {
  const [operator, setOperator] = useState<
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notContains'
    | 'notEquals'
    | 'startsWith'
  >(filter?.operator ?? 'contains');
  const [value, setValue] = useState(filter?.value ?? '');

  const handleOperatorChange = (
    newOperator:
      | 'contains'
      | 'endsWith'
      | 'equals'
      | 'notContains'
      | 'notEquals'
      | 'startsWith',
  ) => {
    setOperator(newOperator);
    if (value) {
      onChange({ operator: newOperator, type: 'text', value });
    }
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    if (newValue) {
      onChange({ operator, type: 'text', value: newValue });
    }
  };

  return (
    <div {...stylex.props(styles.container)}>
      <select
        onChange={(e) => {
          handleOperatorChange(
            e.target.value as
              | 'contains'
              | 'endsWith'
              | 'equals'
              | 'notContains'
              | 'notEquals'
              | 'startsWith',
          );
        }}
        value={operator}
        {...stylex.props(styles.select)}
      >
        <option value='contains'>Contains</option>
        <option value='endsWith'>Ends with</option>
        <option value='equals'>Equals</option>
        <option value='notContains'>Does not contain</option>
        <option value='notEquals'>Does not equal</option>
        <option value='startsWith'>Starts with</option>
      </select>
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
