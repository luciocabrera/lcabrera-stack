import { VirtualSelect } from '@repo/ui/components/VirtualSelect';

import type { OperatorSelectProps } from './OperatorSelect.types';

import {
  getOperatorFromFilter,
  getOperatorOptions,
  getSelectedOperatorLabel,
  resolveOperatorChange,
} from '../utils';
import { styles } from './OperatorSelect.stylex';

/**
 * Operator dropdown for a non-boolean filter: derives the operator options
 * from the column data type and emits the next filter draft on selection —
 * swapping the operator on an existing filter, or seeding a typed empty
 * filter when none exists yet.
 */
export const OperatorSelect = ({
  dataType,
  filter,
  onChange,
  onOpenChange,
  shouldFillHeight = false,
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
      customStylex={shouldFillHeight ? styles.operatorOverride : undefined}
      mode='single'
      onChange={handleOperatorChange}
      onOpenChange={onOpenChange}
      options={operatorLabels}
      placeholder='Select operator...'
      selected={selectedOperatorLabel}
    />
  );
};
