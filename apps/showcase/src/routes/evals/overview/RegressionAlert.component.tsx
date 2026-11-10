import { InfoBox } from '@lcabrera/ui/components/InfoBox';
import { NavLink } from '@lcabrera/ui/components/NavLink';
import { Text } from '@lcabrera/ui/components/Text';
import * as stylex from '@stylexjs/stylex';

import type { RegressionAlertProps } from './EvalsOverview.types';

import { layoutStyles } from '../evalsLayout.stylex';
import { compareHref } from '../utils/compareHref.util';
import { evalsHref } from '../utils/evalsHref.util';
import { styles } from './EvalsOverview.stylex';
import {
  regressionFindingKey,
  regressionFindingLabel,
} from './regressionFindingLabel.util';

export const RegressionAlert = ({
  regression: { findings, flakyLeftOut, latest, previous, suite },
}: RegressionAlertProps) => (
  <InfoBox role='alert' tone='error'>
    <div {...stylex.props(styles.alert)}>
      <Text as='p' size='sm'>
        {suite} regressed on main in{' '}
        <NavLink to={evalsHref({ runId: latest.runId })} variant='inline'>
          the latest run
        </NavLink>{' '}
        against{' '}
        <NavLink to={evalsHref({ runId: previous.runId })} variant='inline'>
          the run before
        </NavLink>
        .{' '}
        <NavLink
          to={compareHref({ a: previous.runId, b: latest.runId })}
          variant='inline'
        >
          Compare them
        </NavLink>
        .
      </Text>
      <ul {...stylex.props(layoutStyles.list)}>
        {findings.map((finding) => (
          <li key={regressionFindingKey(finding)}>
            {regressionFindingLabel(finding)}
          </li>
        ))}
      </ul>
      {flakyLeftOut.length === 0 ? undefined : (
        <Text as='p' size='sm'>
          {flakyLeftOut.length} flaky{' '}
          {flakyLeftOut.length === 1 ? 'task was' : 'tasks were'} left out of
          the rule;{' '}
          <NavLink to='/evals/flaky' variant='inline'>
            see the flaky tasks
          </NavLink>
          .
        </Text>
      )}
    </div>
  </InfoBox>
);
