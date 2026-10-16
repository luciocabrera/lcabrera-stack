import * as stylex from '@stylexjs/stylex';

import type { CostChartsProps } from './EvalsCost.types';

import { EVALS_COST_LABELS } from '../constants/evalsDashboard.constants';
import { Sparkline } from '../Sparkline';
import { styles } from './EvalsCost.stylex';

export const CostCharts = ({ charts }: CostChartsProps) => (
  <div {...stylex.props(styles.charts)}>
    {charts.map(({ computed, p95, reported, suite }) => (
      <section key={suite} {...stylex.props(styles.card)}>
        <h3 {...stylex.props(styles.heading)}>{suite}</h3>
        <p {...stylex.props(styles.note)}>
          Cost per run, {EVALS_COST_LABELS.reported.toLowerCase()}
        </p>
        <Sparkline
          label={`${suite}: cost per run, ${EVALS_COST_LABELS.reported.toLowerCase()}`}
          points={reported}
        />
        <p {...stylex.props(styles.note)}>
          Cost per run, {EVALS_COST_LABELS.computed.toLowerCase()}
        </p>
        <Sparkline
          label={`${suite}: cost per run, ${EVALS_COST_LABELS.computed.toLowerCase()}`}
          points={computed}
        />
        <p {...stylex.props(styles.note)}>p95 duration per run</p>
        <Sparkline label={`${suite}: p95 duration per run`} points={p95} />
      </section>
    ))}
  </div>
);
