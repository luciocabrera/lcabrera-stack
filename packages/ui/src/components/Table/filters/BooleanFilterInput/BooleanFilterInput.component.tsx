import { Button } from '@repo/ui/components/Button';
import * as stylex from '@stylexjs/stylex';

import type { BooleanFilterInputProps } from './BooleanFilterInput.types';

import { styles } from './BooleanFilterInput.stylex';

export const BooleanFilterInput = ({
  filter,
  onChange,
}: BooleanFilterInputProps) => {
  // Derive selected value directly from filter prop (no local state needed)
  const getSelectedValue = (): 'all' | 'false' | 'true' => {
    if (!filter) return 'all';
    return filter.value ? 'true' : 'false';
  };
  const selectedValue = getSelectedValue();

  const handleChange = (newValue: 'all' | 'false' | 'true') => {
    if (newValue === 'all') {
      onChange();
    } else {
      onChange({
        type: 'boolean' as const,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        value: newValue === 'true',
      });
    }
  };

  const handleSelectAll = () => handleChange('all');
  const handleSelectFalse = () => handleChange('false');
  const handleSelectTrue = () => handleChange('true');

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
    </div>
  );
};
