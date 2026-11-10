import { LineChart } from '@lcabrera/ui/components/LineChart';
import { NavLink } from '@lcabrera/ui/components/NavLink';
import { Text } from '@lcabrera/ui/components/Text';
import { Title } from '@lcabrera/ui/components/Title';
import * as stylex from '@stylexjs/stylex';

import type { SubjectTrendSeriesProps } from './EvalsSubjectTrend.types';

import { layoutStyles } from '../evalsLayout.stylex';
import { trendChartSeries } from './trendChartSeries.util';

export const SubjectTrendSeries = ({
  kind,
  name,
  series,
}: SubjectTrendSeriesProps) => {
  const { marks, points, runs, suite } = series;
  const { line, markers } = trendChartSeries(series);

  return (
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        {suite}
      </Title>
      <Text size='sm' tone='secondary'>
        {points.length} scored runs of the last {runs} {suite} runs that record
        this {kind}.
      </Text>
      <LineChart
        hasMarkerLabels={false}
        markers={markers}
        series={[line]}
        title={`${kind} ${name} pass rate in ${suite} over time`}
        yAxis={{ domain: [0, 1] }}
      />
      {marks.length === 0 ? undefined : (
        <ul {...stylex.props(layoutStyles.list)}>
          {marks.map(({ href, key, label, pointLabel }) => (
            <li key={key}>
              <Text as='span' size='sm'>
                {label}:{' '}
                <NavLink to={href} variant='inline'>
                  {pointLabel}
                </NavLink>
              </Text>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
