import * as stylex from '@stylexjs/stylex';
import { useMemo, useState } from 'react';

import type { SelectFilterInputProps } from './SelectFilterInput.types';

import { styles } from './SelectFilterInput.stylex';

export const SelectFilterInput = ({
  filter,
  onChange,
  options,
}: SelectFilterInputProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(
    filter?.values ?? [],
  );

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  const handleToggle = (option: string) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((v) => v !== option)
      : [...selectedValues, option];

    setSelectedValues(newSelectedValues);

    if (newSelectedValues.length === 0) {
      // eslint-disable-next-line unicorn/no-null
      onChange(null);
    } else {
      onChange({
        type: 'select',
        values: newSelectedValues,
      });
    }
  };

  const handleSelectAll = () => {
    const isAllSelected = filteredOptions.length === selectedValues.length;
    const newSelectedValues = isAllSelected ? [] : filteredOptions;

    setSelectedValues(newSelectedValues);

    if (newSelectedValues.length > 0) {
      onChange({
        type: 'select',
        values: newSelectedValues,
      });
    }
  };

  const isAllSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((option) => selectedValues.includes(option));

  return (
    <div {...stylex.props(styles.container)}>
      {options.length > 5 && (
        <input
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          placeholder='Search options...'
          type='text'
          value={searchTerm}
          {...stylex.props(styles.searchInput)}
        />
      )}
      <div {...stylex.props(styles.optionsList)}>
        {filteredOptions.length > 1 && (
          <label {...stylex.props(styles.option)}>
            <input
              checked={isAllSelected}
              onChange={handleSelectAll}
              type='checkbox'
              {...stylex.props(styles.checkbox)}
            />
            <span {...stylex.props(styles.label)}>
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </span>
          </label>
        )}
        {filteredOptions.length === 0 ? (
          <div {...stylex.props(styles.noResults)}>No options found</div>
        ) : (
          filteredOptions.map((option) => (
            <label key={option} {...stylex.props(styles.option)}>
              <input
                checked={selectedValues.includes(option)}
                onChange={() => {
                  handleToggle(option);
                }}
                type='checkbox'
                {...stylex.props(styles.checkbox)}
              />
              <span {...stylex.props(styles.label)}>{option}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
};
