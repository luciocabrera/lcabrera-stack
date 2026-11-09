import { Card } from '@lcabrera/ui/components/Card';
import { Text } from '@lcabrera/ui/components/Text';
import { Title } from '@lcabrera/ui/components/Title';
import { TrendSparkline } from '@lcabrera/ui/components/TrendSparkline';
import * as stylex from '@stylexjs/stylex';

import type { CostChartsProps } from './EvalsCost.types';

import { pageStyles } from '../evalsPage.stylex';
import { COST_CHARTS, COST_SPARKLINE } from './EvalsCost.constants';
import { styles } from './EvalsCost.stylex';

export const CostCharts = ({ charts }: CostChartsProps) => (
  <div {...stylex.props(styles.charts)}>
    {charts.map((chart) => (
      <Card customStylex={pageStyles.section} key={chart.suite} padding='md'>
        <Title level={3} variant='plain'>
          {chart.suite}
        </Title>
        {COST_CHARTS.map(({ caption, metric }) => (
          <figure
            aria-label={`${chart.suite}: ${caption.toLowerCase()}`}
            key={metric}
            {...stylex.props(styles.figure)}
          >
            <Text as='figcaption' size='sm' tone='secondary'>
              {caption}
            </Text>
            <TrendSparkline
              height={COST_SPARKLINE.height}
              label={`${chart.suite}: ${caption.toLowerCase()}`}
              points={chart[metric]}
              width={COST_SPARKLINE.width}
            />
          </figure>
        ))}
      </Card>
    ))}
  </div>
);
