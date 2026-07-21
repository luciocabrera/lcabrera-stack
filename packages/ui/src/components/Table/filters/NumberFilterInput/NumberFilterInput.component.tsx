import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type {
  NumberFilterInputProps,
  UpdateFilterArgs,
} from './NumberFilterInput.types';

import { NO_AUTOFILL_INPUT_PROPS } from '../filters.constants';
import { styles } from './NumberFilterInput.stylex';
import { computeInitialMaxValue, computeInitialValue } from './utils';

export const NumberFilterInput = <TData,>({
  filter,
  onChange,
  operator,
}: NumberFilterInputProps<TData>) => {
  const initialValue = computeInitialValue(filter);
  const initialMaxValue = computeInitialMaxValue(filter);

  const [value, setValue] = useState<'' | number>(initialValue);
  const [maxValue, setMaxValue] = useState<'' | number>(initialMaxValue);

  const updateFilter = ({ maxVal, op, val }: UpdateFilterArgs) => {
    if (op === 'between') {
      onChange({
        operator: 'between',
        type: 'number',
        value: val === '' ? undefined : val,
        value2: maxVal === '' ? undefined : maxVal,
      });
      return;
    }
    onChange({
      operator: op,
      type: 'number',
      value: val === '' ? undefined : val,
    });
  };

  const handleValueChange = (
    e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
  ) => {
    const newValue = e.target.value === '' ? '' : Number(e.target.value);
    setValue(newValue);
    updateFilter({ maxVal: maxValue, op: operator, val: newValue });
  };

  const handleMaxValueChange = (
    e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
  ) => {
    const newMaxValue = e.target.value === '' ? '' : Number(e.target.value);
    setMaxValue(newMaxValue);
    updateFilter({ maxVal: newMaxValue, op: operator, val: value });
  };

  return (
    <div {...stylex.props(styles.container)}>
      {operator === 'between' ? (
        <div {...stylex.props(styles.inputGroup)}>
          <input
            {...NO_AUTOFILL_INPUT_PROPS}
            onChange={handleValueChange}
            placeholder='Min'
            type='number'
            value={value}
            {...stylex.props(styles.input)}
          />
          <span {...stylex.props(styles.separator)}>to</span>
          <input
            {...NO_AUTOFILL_INPUT_PROPS}
            onChange={handleMaxValueChange}
            placeholder='Max'
            type='number'
            value={maxValue}
            {...stylex.props(styles.input)}
          />
        </div>
      ) : (
        <input
          {...NO_AUTOFILL_INPUT_PROPS}
          onChange={handleValueChange}
          placeholder='Enter number...'
          type='number'
          value={value}
          {...stylex.props(styles.input)}
        />
      )}
    </div>
  );
};
