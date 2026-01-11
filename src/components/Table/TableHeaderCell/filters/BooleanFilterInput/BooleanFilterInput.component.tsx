import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { BooleanFilterInputProps } from './BooleanFilterInput.types';

import { styles } from './BooleanFilterInput.stylex';

export const BooleanFilterInput = ({
  filter,
  onChange,
}: BooleanFilterInputProps) => {
  const [selectedValue, setSelectedValue] = useState<'all' | 'false' | 'true'>(
    filter ? (filter.value ? 'true' : 'false') : 'all',
  );

  const handleChange = (newValue: 'all' | 'false' | 'true') => {
    setSelectedValue(newValue);
    if (newValue !== 'all') {
      onChange({
        type: 'boolean',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        value: newValue === 'true',
      });
    }
  };

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.radioGroup)}>
        <label {...stylex.props(styles.radioOption)}>
          <input
            checked={selectedValue === 'all'}
            name='boolean-filter'
            onChange={() => {
              handleChange('all');
            }}
            type='radio'
            {...stylex.props(styles.radio)}
          />
          <span {...stylex.props(styles.label)}>All</span>
        </label>
        <label {...stylex.props(styles.radioOption)}>
          <input
            checked={selectedValue === 'true'}
            name='boolean-filter'
            onChange={() => {
              handleChange('true');
            }}
            type='radio'
            {...stylex.props(styles.radio)}
          />
          <span {...stylex.props(styles.label)}>True</span>
        </label>
        <label {...stylex.props(styles.radioOption)}>
          <input
            checked={selectedValue === 'false'}
            name='boolean-filter'
            onChange={() => {
              handleChange('false');
            }}
            type='radio'
            {...stylex.props(styles.radio)}
          />
          <span {...stylex.props(styles.label)}>False</span>
        </label>
      </div>
    </div>
  );
};
