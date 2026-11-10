import { NavLink } from '@lcabrera/ui/components/NavLink';
import { PageHeader } from '@lcabrera/ui/components/PageHeader';
import { Text } from '@lcabrera/ui/components/Text';
import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-overview.loader';

import { layoutStyles } from '../evalsLayout.stylex';
import { EVALS_VIEWS } from './EvalsOverview.constants';
import { styles } from './EvalsOverview.stylex';
import { RegressionAlert } from './RegressionAlert.component';
import { SuiteCard } from './SuiteCard.component';

export const EvalsOverview = () => {
  const { regressions, suites } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(layoutStyles.page)}>
      <PageHeader title='Evals' />
      <nav aria-label='Eval views'>
        <ul {...stylex.props(layoutStyles.row)}>
          {EVALS_VIEWS.map(({ label, to }) => (
            <li key={to}>
              <NavLink to={to} variant='inline'>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {regressions.map((regression) => (
        <RegressionAlert key={regression.suite} regression={regression} />
      ))}
      {suites.length === 0 && <Text>No eval runs are stored yet.</Text>}
      <div {...stylex.props(styles.grid)}>
        {suites.map((summary) => (
          <SuiteCard key={summary.suite} summary={summary} />
        ))}
      </div>
    </div>
  );
};
