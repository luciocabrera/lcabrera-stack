import { VirtualSelect } from '@lcabrera/ui/components/VirtualSelect';
import { useState } from 'react';

import type { RunSelectProps } from './EvalsCompare.types';

export const RunSelect = ({
  defaultValue,
  label,
  name,
  options,
}: RunSelectProps) => {
  const [selected, setSelected] = useState<readonly string[]>(
    defaultValue === undefined ? [] : [defaultValue],
  );

  return (
    <VirtualSelect
      label={label}
      mode='single'
      name={name}
      onChange={setSelected}
      options={options}
      placeholder='Select a run...'
      selected={selected}
    />
  );
};
