import { NavLink } from '@lcabrera/ui/components/NavLink';
import * as stylex from '@stylexjs/stylex';

import type { ConfusionRunPickerProps } from './EvalsConfusion.types';

import { confusionRunHref } from './confusionRunHref.util';
import { styles } from './EvalsConfusion.stylex';

export const ConfusionRunPicker = ({
  choices,
  selectedRunId,
}: ConfusionRunPickerProps) => (
  <nav aria-label='Runs'>
    <ul {...stylex.props(styles.choices)}>
      <li>
        <NavLink
          isActive={selectedRunId === undefined}
          to={confusionRunHref()}
          variant='inline'
        >
          Recent runs
        </NavLink>
      </li>
      {choices.map(({ label, runId }) => (
        <li key={runId}>
          <NavLink
            isActive={runId === selectedRunId}
            to={confusionRunHref(runId)}
            variant='inline'
          >
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);
