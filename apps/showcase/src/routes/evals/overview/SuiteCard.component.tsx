import { Card } from '@lcabrera/ui/components/Card';
import { DescriptionList } from '@lcabrera/ui/components/DescriptionList';
import { NavLink } from '@lcabrera/ui/components/NavLink';
import { Title } from '@lcabrera/ui/components/Title';
import { TrendSparkline } from '@lcabrera/ui/components/TrendSparkline';

import type { SuiteCardProps } from './EvalsOverview.types';

import { layoutStyles } from '../evalsLayout.stylex';
import { evalsHref } from '../utils/evalsHref.util';
import { OVERVIEW_SPARKLINE } from './EvalsOverview.constants';
import { suiteFacts } from './suiteFacts.util';

export const SuiteCard = ({ summary }: SuiteCardProps) => (
  <Card customStylex={layoutStyles.section} padding='lg'>
    <Title level={2} variant='plain'>
      <NavLink to={evalsHref({ runId: summary.latest.runId })} variant='inline'>
        {summary.suite}
      </NavLink>
    </Title>
    <DescriptionList
      items={suiteFacts(summary).map(({ term, to, value }) => ({
        term,
        value:
          to === undefined ? (
            value
          ) : (
            <NavLink to={to} variant='inline'>
              {value}
            </NavLink>
          ),
      }))}
    />
    <TrendSparkline
      emptyRole='group'
      height={OVERVIEW_SPARKLINE.height}
      label={`${summary.suite} pass rate over its last ${String(summary.points.length)} runs`}
      max={1}
      points={summary.points}
      width={OVERVIEW_SPARKLINE.width}
    />
  </Card>
);
