import * as stylex from '@stylexjs/stylex';
import { Form } from 'react-router';

import type { ComparePickerProps } from './EvalsCompare.types';

import { PREFILLED_CHOICE } from './EvalsCompare.constants';
import { styles } from './EvalsCompare.stylex';
import { runChoiceLabel } from './runChoiceLabel.util';

export const ComparePicker = ({ choices }: ComparePickerProps) => (
  <>
    <Form method='get' {...stylex.props(styles.form)}>
      {(['a', 'b'] as const).map((side) => (
        <label key={side} {...stylex.props(styles.field)}>
          <span>Run {side.toUpperCase()}</span>
          <select
            defaultValue={choices[PREFILLED_CHOICE[side]]?.runId}
            name={side}
            required
          >
            {choices.map((run) => (
              <option key={run.runId} value={run.runId}>
                {runChoiceLabel(run)}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button type='submit'>Compare runs</button>
    </Form>
    <Form method='get' {...stylex.props(styles.form)}>
      <label {...stylex.props(styles.field)}>
        <span>Branch</span>
        <input name='branch' placeholder='feat/…' required />
      </label>
      <button type='submit'>Compare with main</button>
    </Form>
  </>
);
