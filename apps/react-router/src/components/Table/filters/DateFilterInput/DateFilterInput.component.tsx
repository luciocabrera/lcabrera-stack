import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type {
  DateFilterInputProps,
  UpdateDateFilterArgs,
} from './DateFilterInput.types';

import { styles } from './DateFilterInput.stylex';
import { computeInitialEndDate, computeInitialValue } from './utils';

export const DateFilterInput = ({
  filter,
  onChange,
  operator,
}: DateFilterInputProps) => {
  const initialValue = computeInitialValue(filter);
  const initialEndDate = computeInitialEndDate(filter);

  const [value, setValue] = useState(initialValue);
  const [endDate, setEndDate] = useState(initialEndDate);

  const updateFilter = ({ end, op, val }: UpdateDateFilterArgs) => {
    if (op === 'between') {
      onChange({
        operator: 'between',
        type: 'date',
        value: val,
        value2: end || undefined,
      });
      return;
    }
    onChange({
      operator: op,
      type: 'date',
      value: val,
    });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    updateFilter({ end: endDate, op: operator, val: newValue });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    updateFilter({ end: newEndDate, op: operator, val: value });
  };

  return (
    <div {...stylex.props(styles.container)}>
      {operator === 'between' ? (
        <div {...stylex.props(styles.inputGroup)}>
          <input
            autoComplete='one-time-code'
            data-1p-ignore='true'
            data-bwignore='true'
            data-form-type='other'
            data-lpignore='true'
            onChange={handleValueChange}
            type='date'
            value={value}
            {...stylex.props(styles.input)}
          />
          <span {...stylex.props(styles.separator)}>to</span>
          <input
            autoComplete='one-time-code'
            data-1p-ignore='true'
            data-bwignore='true'
            data-form-type='other'
            data-lpignore='true'
            onChange={handleEndDateChange}
            type='date'
            value={endDate}
            {...stylex.props(styles.input)}
          />
        </div>
      ) : (
        <input
          autoComplete='one-time-code'
          data-1p-ignore='true'
          data-bwignore='true'
          data-form-type='other'
          data-lpignore='true'
          onChange={handleValueChange}
          type='date'
          value={value}
          {...stylex.props(styles.input)}
        />
      )}
    </div>
  );
};
