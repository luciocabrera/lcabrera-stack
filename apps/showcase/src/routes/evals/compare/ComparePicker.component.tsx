import { Button, Card, Select, TextInput } from '@lcabrera/ui';
import * as stylex from '@stylexjs/stylex';
import { Form, useNavigation } from 'react-router';

import type { ComparePickerProps } from './EvalsCompare.types';

import { PREFILLED_CHOICE } from './EvalsCompare.constants';
import { styles } from './EvalsCompare.stylex';
import { isSubmittingField } from './isSubmittingField.util';
import { runChoiceLabel } from './runChoiceLabel.util';

export const ComparePicker = ({ choices }: ComparePickerProps) => {
  const { location } = useNavigation();
  const options = choices.map((run) => ({
    label: runChoiceLabel(run),
    value: run.runId,
  }));

  return (
    <>
      <Card padding='md'>
        <Form method='get' {...stylex.props(styles.form)}>
          {(['a', 'b'] as const).map((side) => (
            <Select
              defaultValue={choices[PREFILLED_CHOICE[side]]?.runId}
              key={side}
              label={`Run ${side.toUpperCase()}`}
              name={side}
              options={options}
              required
            />
          ))}
          <Button
            customStylex={styles.submit}
            isBusy={isSubmittingField({ field: 'a', location })}
            type='submit'
          >
            Compare runs
          </Button>
        </Form>
      </Card>
      <Card padding='md'>
        <Form method='get' {...stylex.props(styles.form)}>
          <TextInput
            label='Branch'
            name='branch'
            placeholder='feat/…'
            required
          />
          <Button
            customStylex={styles.submit}
            isBusy={isSubmittingField({ field: 'branch', location })}
            type='submit'
          >
            Compare with main
          </Button>
        </Form>
      </Card>
    </>
  );
};
