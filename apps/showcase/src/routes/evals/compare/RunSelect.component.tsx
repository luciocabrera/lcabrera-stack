import { VirtualSelect } from '@lcabrera/ui/components/VirtualSelect';
import { useState } from 'react';

import type { RunSelectProps } from './EvalsCompare.types';

export const RunSelect = ({
  defaultValue,
  label,
  name,
  options,
}: RunSelectProps) => {
  const initial = defaultValue ?? options[0]?.value;
  const [selected, setSelected] = useState<readonly string[]>(
    initial === undefined ? [] : [initial],
  );

  const handleChange = (next: readonly string[]) => {
    if (next.length > 0) {
      setSelected(next);
    }
  };

  return (
    <VirtualSelect
      label={label}
      mode='single'
      name={name}
      onChange={handleChange}
      options={options}
      placeholder='Select a run...'
      selected={selected}
    />
  );
};
