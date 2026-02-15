import * as stylex from '@stylexjs/stylex';
import { useMemo, useState } from 'react';

import type { DateFilter } from '@/types/filterOperators.types';

import type {
  DateFilterInputProps,
  UpdateDateFilterArgs,
} from './DateFilterInput.types';

import { styles } from './DateFilterInput.stylex';

const computeInitialValue = (filter: DateFilter | undefined): string => {
  if (filter?.operator === 'between') {
    return filter.value;
  }
  return filter?.value ?? '';
};

const computeInitialEndDate = (filter: DateFilter | undefined): string => {
  if (filter?.operator === 'between') {
    return filter.value2 ?? '';
  }
  return '';
};

export const DateFilterInput = ({
  columnKey,
  filter,
  onChange,
  operator,
}: DateFilterInputProps) => {
  const initialValue = useMemo(() => computeInitialValue(filter), [filter]);
  const initialEndDate = useMemo(() => computeInitialEndDate(filter), [filter]);

  const [value, setValue] = useState(initialValue);
  const [endDate, setEndDate] = useState(initialEndDate);

  const updateFilter = ({ end, op, val }: UpdateDateFilterArgs) => {
    if (op === 'between') {
      if (val && end) {
        onChange({
          operator: 'between',
          type: 'date',
          value: val,
          value2: end,
        });
      } else {
        onChange();
      }
      return;
    }
    if (val) {
      onChange({
        operator: op,
        type: 'date',
        value: val,
      });
    } else {
      onChange();
    }
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
            autoComplete="off"
            data-1p-ignore="true"
            data-bwignore="true"
            data-form-type="other"
            data-lpignore="true"
            data-np-checked="1"
            data-np-ignore="1"
            name={`filter-date-start-${columnKey}`}
            onChange={handleValueChange}
            type='date'
            value={value}
            {...stylex.props(styles.input)}
          />
          <span {...stylex.props(styles.separator)}>to</span>
          <input
            autoComplete="off"
            data-1p-ignore="true"
            data-bwignore="true"
            data-form-type="other"
            data-lpignore="true"
            data-np-checked="1"
            data-np-ignore="1"
            name={`filter-date-end-${columnKey}`}
            onChange={handleEndDateChange}
            type='date'
            value={endDate}
            {...stylex.props(styles.input)}
          />
        </div>
      ) : (
        <input
          autoComplete="off"
          data-1p-ignore="true"
          data-bwignore="true"
          data-form-type="other"
          data-lpignore="true"
          data-np-checked="1"
          data-np-ignore="1"
          name={`filter-date-${columnKey}`}
          onChange={handleValueChange}
          type='date'
          value={value}
          {...stylex.props(styles.input)}
        />
      )}
    </div>
  );
};
