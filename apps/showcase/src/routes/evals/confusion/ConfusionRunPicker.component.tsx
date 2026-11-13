import { VirtualSelect } from '@lcabrera/ui/components/VirtualSelect';
import * as stylex from '@stylexjs/stylex';
import { useNavigate } from 'react-router';

import type { ConfusionRunPickerProps } from './EvalsConfusion.types';

import { confusionRunHref } from './confusionRunHref.util';
import { styles } from './EvalsConfusion.stylex';

export const ConfusionRunPicker = ({
  choices,
  selectedRunId,
}: ConfusionRunPickerProps) => {
  const navigate = useNavigate();

  return (
    <div {...stylex.props(styles.picker)}>
      <VirtualSelect
        label='Run'
        mode='single'
        onChange={([href]) => {
          if (href !== undefined) void navigate(href);
        }}
        options={[
          { label: 'Recent runs', value: confusionRunHref() },
          ...choices.map(({ label, runId }) => ({
            label,
            value: confusionRunHref(runId),
          })),
        ]}
        selected={[confusionRunHref(selectedRunId)]}
      />
    </div>
  );
};
