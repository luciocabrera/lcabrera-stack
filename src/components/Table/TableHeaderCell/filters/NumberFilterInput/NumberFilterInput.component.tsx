import * as stylex from '@stylexjs/stylex';
import { useMemo, useState } from 'react';

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

export const NumberFilterInput = ({
  filter,
  onChange,
  operator,
}: NumberFilterInputProps) => {
  const initialValue = useMemo(() => computeInitialValue(filter), [filter]);
  const initialMaxValue = useMemo(
    () => computeInitialMaxValue(filter),
    [filter],
  );

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

  const handleValueChange = (newValue: '' | number) => {
    setValue(newValue);
    updateFilter({ maxVal: maxValue, op: operator, val: newValue });
  };

  const handleMaxValueChange = (newMaxValue: '' | number) => {
    setMaxValue(newMaxValue);
    updateFilter({ maxVal: newMaxValue, op: operator, val: value });
  };

  return (
    <div {...stylex.props(styles.container)}>
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
