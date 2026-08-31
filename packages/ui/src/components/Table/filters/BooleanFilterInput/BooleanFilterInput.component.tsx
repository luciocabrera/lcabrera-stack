import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { EMPTY_OPERATORS } from '#ui/constants/filterOperators.constants';

import type { BooleanFilterInputProps } from './BooleanFilterInput.types';

import { styles } from './BooleanFilterInput.stylex';

export const BooleanFilterInput = ({
  filter,
  onChange,
}: BooleanFilterInputProps) => {
  const getSelectedValue = () => {
    if (!filter) return 'all';
    if (filter.type === 'empty') return filter.operator;

    return filter.value ? 'true' : 'false';
  };
  const selectedValue = getSelectedValue();

  const handleSelectAll = () => onChange();
  const handleSelectFalse = () => onChange({ type: 'boolean', value: false });
  const handleSelectTrue = () => onChange({ type: 'boolean', value: true });

  return (
    <div {...stylex.props(styles.container)}>
      <Button
        onClick={handleSelectAll}
        size='sm'
        variant={selectedValue === 'all' ? 'primary' : 'outline'}
      >
        All
      </Button>
      <Button
        onClick={handleSelectTrue}
        size='sm'
        variant={selectedValue === 'true' ? 'primary' : 'outline'}
      >
        True
      </Button>
      <Button
        onClick={handleSelectFalse}
        size='sm'
        variant={selectedValue === 'false' ? 'primary' : 'outline'}
      >
        False
      </Button>
      {EMPTY_OPERATORS.map(({ label, value }) => (
        <Button
          key={value}
          onClick={() => {
            onChange({ operator: value, type: 'empty' });
          }}
          size='sm'
          variant={selectedValue === value ? 'primary' : 'outline'}
        >
          {label}
        </Button>
      ))}
    </div>
  );
};
