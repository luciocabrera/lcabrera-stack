import { VirtualSelect } from '#ui/components/VirtualSelect';

import type { OperatorSelectProps } from './OperatorSelect.types';

import {
  getOperatorFromFilter,
  getOperatorOptions,
  getSelectedOperatorLabel,
  resolveOperatorChange,
} from '../utils';

export const OperatorSelect = ({
  dataType,
  filter,
  onChange,
  onOpenChange,
}: OperatorSelectProps) => {
  const operator = getOperatorFromFilter({ dataType, filter });
  const operatorOptions = getOperatorOptions({ dataType });
  const operatorLabels = operatorOptions.map((op) => op.label);

  const selectedOperatorLabel = getSelectedOperatorLabel({
    filter,
    operator,
    operatorOptions,
  });

  const handleOperatorChange = (selectedLabels: string[]) => {
    const selectedLabel = selectedLabels[0];
    if (!selectedLabel) return;

    const matchingOp = operatorOptions.find((op) => op.label === selectedLabel);
    if (!matchingOp || filter?.type === 'boolean') return;

    onChange(
      resolveOperatorChange({ dataType, filter, operator: matchingOp.value }),
    );
  };

  return (
    <VirtualSelect
      mode='single'
      onChange={handleOperatorChange}
      onOpenChange={onOpenChange}
      options={operatorLabels}
      placeholder='Select operator...'
      selected={selectedOperatorLabel}
    />
  );
};
