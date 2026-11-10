import { Heatmap } from '@lcabrera/ui/components/Heatmap';
import { LineChart } from '@lcabrera/ui/components/LineChart';
import { Table } from '@lcabrera/ui/components/Table';
import { Text } from '@lcabrera/ui/components/Text';
import { Title } from '@lcabrera/ui/components/Title';
import * as stylex from '@stylexjs/stylex';

import type { AdjudicationAccuracyProps } from './EvalsAdjudications.types';

import { layoutStyles } from '../evalsLayout.stylex';
import { accuracyChartSeries } from './accuracyChartSeries.util';
import {
  ACCURACY_COLUMNS,
  ACCURACY_LEGEND,
  PROMPT_COLUMNS,
} from './EvalsAdjudications.constants';

export const AdjudicationAccuracy = ({
  accuracy,
  heatmap,
  prompts,
  trend,
}: AdjudicationAccuracyProps) => (
  <>
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        Accuracy by model and role
      </Title>
      {accuracy.length === 0 ? (
        <Text size='sm' tone='secondary'>
          No case has a true answer yet, so no verdict can be scored.
        </Text>
      ) : (
        <>
          <Table
            caption='Verdicts scored against the latest true answer, by model and role'
            columns={ACCURACY_COLUMNS}
            density='compact'
            layout='static'
            response={accuracy}
          />
          <LineChart
            hasDataTable
            series={accuracyChartSeries(trend)}
            title='Accuracy of each model over the cases it sat on, in the order they opened'
            yAxis={{ domain: [0, 1] }}
          />
        </>
      )}
    </section>
    {heatmap.cells.length === 0 ? undefined : (
      <section {...stylex.props(layoutStyles.section)}>
        <Title level={2} variant='plain'>
          Accuracy by model and rule
        </Title>
        <Heatmap
          cells={heatmap.cells}
          columns={heatmap.columns}
          hasDataTable
          legend={ACCURACY_LEGEND}
          rows={heatmap.rows}
          title={heatmap.title}
        />
      </section>
    )}
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        Accuracy by prompt
      </Title>
      <Text size='sm' tone='secondary'>
        A new prompt hash is an edited fp-judge or fp-adversary definition, so
        the rows of one role show its accuracy before and after each change.
      </Text>
      <Table
        caption='Verdicts by role and prompt hash, oldest prompt first'
        columns={PROMPT_COLUMNS}
        density='compact'
        layout='static'
        response={prompts}
      />
    </section>
  </>
);
