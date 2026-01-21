import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { DateFilterInputProps } from './DateFilterInput.types';

import { styles } from './DateFilterInput.stylex';

export const DateFilterInput = ({ filter, onChange }: DateFilterInputProps) => {
  const [operator, setOperator] = useState<
    'after' | 'before' | 'between' | 'equals'
  >(filter?.operator ?? 'equals');
  const [value, setValue] = useState(
    filter?.operator === 'between' ? filter.value : (filter?.value ?? ''),
  );
  const [endDate, setEndDate] = useState(
    filter?.operator === 'between' ? (filter.value2 ?? '') : '',
  );

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperator = e.target.value as
      | 'after'
      | 'before'
      | 'between'
      | 'equals';
    setOperator(newOperator);
    updateFilter({ end: endDate, op: newOperator, val: value });
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

  const updateFilter = (args: {
    end: string;
    op: 'after' | 'before' | 'between' | 'equals';
    val: string;
  }) => {
    const { end, op, val } = args;
    if (op === 'between') {
      if (val && end) {
        const filterValue = {
          operator: 'between',
          type: 'date',
          value: val,
          value2: end,
        };
        onChange(filterValue as never);
      }
    } else {
      if (val) {
        const filterValue = {
          operator: op,
          type: 'date',
          value: val,
        };
        onChange(filterValue as never);
      }
    }
  };

  return (
    <div {...stylex.props(styles.container)}>
      <select
        onChange={handleOperatorChange}
        value={operator}
        {...stylex.props(styles.select)}
      >
        <option value='after'>After</option>
        <option value='before'>Before</option>
        <option value='between'>Between</option>
        <option value='equals'>Equals</option>
      </select>
      {operator === 'between' ? (
        <div {...stylex.props(styles.inputGroup)}>
          <input
            onChange={handleValueChange}
            type='date'
            value={value}
            {...stylex.props(styles.input)}
          />
          <span {...stylex.props(styles.separator)}>to</span>
          <input
            onChange={handleEndDateChange}
            type='date'
            value={endDate}
            {...stylex.props(styles.input)}
          />
        </div>
      ) : (
        <input
          onChange={handleValueChange}
          type='date'
          value={value}
          {...stylex.props(styles.input)}
        />
      )}
    </div>
  );
};
