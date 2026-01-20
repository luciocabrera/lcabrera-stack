import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { TextFilterInputProps } from './TextFilterInput.types';

import { styles } from './TextFilterInput.stylex';

export const TextFilterInput = ({
  filter,
  onChange,
  onOperatorChange,
}: TextFilterInputProps) => {
  const [operator, setOperator] = useState<
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notContains'
    | 'notEquals'
    | 'startsWith'
  >(filter?.operator ?? 'equals');
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
    onOperatorChange?.(newOperator);
    // Only update filter if we have a value or if operator is equals/notEquals
    if (value || newOperator === 'equals' || newOperator === 'notEquals') {
      if (value) {
        onChange({ operator: newOperator, type: 'text', value });
      } else {
        onChange();
      }
    }
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    if (newValue) {
      onChange({ operator, type: 'text', value: newValue });
    } else {
      onChange();
    }
  };

  const isInputVisible =
    operator !== 'equals' && operator !== 'notEquals';

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
        <option value='equals'>Equals</option>
        <option value='notEquals'>Does not equal</option>
        <option value='contains'>Contains</option>
        <option value='notContains'>Does not contain</option>
        <option value='startsWith'>Starts with</option>
        <option value='endsWith'>Ends with</option>
      </select>
      {isInputVisible && (
        <input
          onChange={(e) => {
            handleValueChange(e.target.value);
          }}
          placeholder='Enter text...'
          type='text'
          value={value}
          {...stylex.props(styles.input)}
        />
      )}
    </div>
  );
};
