import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type {
  NumberFilterInputProps,
  UpdateFilterArgs,
} from './NumberFilterInput.types';

import { styles } from './NumberFilterInput.stylex';

export const NumberFilterInput = ({
  filter,
  onChange,
}: NumberFilterInputProps) => {
  const [operator, setOperator] = useState<
    | 'between'
    | 'equals'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'notEquals'
  >(filter?.operator ?? 'equals');
  const [value, setValue] = useState<'' | number>(
    filter?.operator === 'between' ? filter.value : (filter?.value ?? ''),
  );
  const [maxValue, setMaxValue] = useState<'' | number>(
    filter?.operator === 'between' ? (filter.value2 ?? '') : '',
  );

  const handleOperatorChange = (
    newOperator:
      | 'between'
      | 'equals'
      | 'greaterThan'
      | 'greaterThanOrEqual'
      | 'lessThan'
      | 'lessThanOrEqual'
      | 'notEquals',
  ) => {
    setOperator(newOperator);
    updateFilter({ maxVal: maxValue, op: newOperator, val: value });
  };

  const handleValueChange = (newValue: '' | number) => {
    setValue(newValue);
    updateFilter({ maxVal: maxValue, op: operator, val: newValue });
  };

  const handleMaxValueChange = (newMaxValue: '' | number) => {
    setMaxValue(newMaxValue);
    updateFilter({ maxVal: newMaxValue, op: operator, val: value });
  };

  const updateFilter = ({ maxVal, op, val }: UpdateFilterArgs) => {
    if (op === 'between') {
      if (val !== '' && maxVal !== '') {
        onChange({
          operator: 'between',
          type: 'number',
          value: val,
          value2: maxVal,
        });
      }
    } else {
      if (val !== '') {
        onChange({
          operator: op,
          type: 'number',
          value: val,
        });
      }
    }
  };

  return (
    <div {...stylex.props(styles.container)}>
      <select
        onChange={(e) => {
          handleOperatorChange(
            e.target.value as
              | 'between'
              | 'equals'
              | 'greaterThan'
              | 'greaterThanOrEqual'
              | 'lessThan'
              | 'lessThanOrEqual'
              | 'notEquals',
          );
        }}
        value={operator}
        {...stylex.props(styles.select)}
      >
        <option value='between'>Between</option>
        <option value='equals'>Equals</option>
        <option value='greaterThan'>Greater than</option>
        <option value='greaterThanOrEqual'>Greater than or equal</option>
        <option value='lessThan'>Less than</option>
        <option value='lessThanOrEqual'>Less than or equal</option>
        <option value='notEquals'>Not equals</option>
      </select>
      {operator === 'between' ? (
        <div {...stylex.props(styles.inputGroup)}>
          <input
            onChange={(e) => {
              handleValueChange(
                e.target.value === '' ? '' : Number(e.target.value),
              );
            }}
            placeholder='Min'
            type='number'
            value={value}
            {...stylex.props(styles.input)}
          />
          <span {...stylex.props(styles.separator)}>to</span>
          <input
            onChange={(e) => {
              handleMaxValueChange(
                e.target.value === '' ? '' : Number(e.target.value),
              );
            }}
            placeholder='Max'
            type='number'
            value={maxValue}
            {...stylex.props(styles.input)}
          />
        </div>
      ) : (
        <input
          onChange={(e) => {
            handleValueChange(
              e.target.value === '' ? '' : Number(e.target.value),
            );
          }}
          placeholder='Enter number...'
          type='number'
          value={value}
          {...stylex.props(styles.input)}
        />
      )}
    </div>
  );
};
