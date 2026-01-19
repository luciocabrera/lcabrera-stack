import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';

import type { BooleanFilterInputProps } from './BooleanFilterInput.types';

import { styles } from './BooleanFilterInput.stylex';

export const BooleanFilterInput = ({
  filter,
  onChange,
}: BooleanFilterInputProps) => {
  // Derive selected value directly from filter prop (no local state needed)
  const selectedValue: 'all' | 'false' | 'true' = filter
    ? filter.value
      ? 'true'
      : 'false'
    : 'all';

  const handleChange = (newValue: 'all' | 'false' | 'true') => {
    if (newValue === 'all') {
      // eslint-disable-next-line unicorn/no-null
      onChange(null);
    } else {
      onChange({
        type: 'boolean' as const,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        value: newValue === 'true',
      });
    }
  };

  return (
    <div {...stylex.props(styles.container)}>
      <Button
        color={selectedValue === 'all' ? 'primary' : 'outline'}
        onClick={() => {
          handleChange('all');
        }}
        size='sm'
        width='full'
      >
        All
      </Button>
      <Button
        color={selectedValue === 'true' ? 'primary' : 'outline'}
        onClick={() => {
          handleChange('true');
        }}
        size='sm'
        width='full'
      >
        True
      </Button>
      <Button
        color={selectedValue === 'false' ? 'primary' : 'outline'}
        onClick={() => {
          handleChange('false');
        }}
        size='sm'
        width='full'
      >
        False
      </Button>
    </div>
  );
};
