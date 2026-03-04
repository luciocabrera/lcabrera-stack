import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { NumberFilter } from '@/types/filterOperators.types';

import type {
  NumberFilterInputProps,
  UpdateFilterArgs,
} from './NumberFilterInput.types';

import { styles } from './NumberFilterInput.stylex';

const computeInitialValue = (filter: NumberFilter | undefined): '' | number => {
  if (filter?.operator === 'between') {
    return filter.value;
  }
  return filter?.value ?? '';
};

const computeInitialMaxValue = (
  filter: NumberFilter | undefined,
): '' | number => {
  if (filter?.operator === 'between') {
    return filter.value2 ?? '';
  }
  return '';
};

export const NumberFilterInput = <TData,>({
  columnKey,
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
      if (val === '' || maxVal === '') {
        onChange();
        return;
      }
      onChange({
        operator: 'between',
        type: 'number',
        value: val,
        value2: maxVal,
      });
      return;
    }
    if (val === '') {
      onChange();
      return;
    }
    onChange({
      operator: op,
      type: 'number',
      value: val,
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
            autoComplete='off'
            data-1p-ignore='true'
            data-bwignore='true'
            data-form-type='other'
            data-lpignore='true'
            data-np-checked='1'
            data-np-ignore='1'
            name={`filter-number-min-${columnKey}`}
            onChange={handleValueChange}
            placeholder='Min'
            type='number'
            value={value}
            {...stylex.props(styles.input)}
          />
          <span {...stylex.props(styles.separator)}>to</span>
          <input
            autoComplete='off'
            data-1p-ignore='true'
            data-bwignore='true'
            data-form-type='other'
            data-lpignore='true'
            data-np-checked='1'
            data-np-ignore='1'
            name={`filter-number-max-${columnKey}`}
            onChange={handleMaxValueChange}
            placeholder='Max'
            type='number'
            value={maxValue}
            {...stylex.props(styles.input)}
          />
        </div>
      ) : (
        <input
          autoComplete='off'
          data-1p-ignore='true'
          data-bwignore='true'
          data-form-type='other'
          data-lpignore='true'
          data-np-checked='1'
          data-np-ignore='1'
          name={`filter-number-${columnKey}`}
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
