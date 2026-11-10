import { DescriptionList } from '@lcabrera/ui/components/DescriptionList';
import { PageHeader } from '@lcabrera/ui/components/PageHeader';
import { Text } from '@lcabrera/ui/components/Text';
import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-adjudications.loader';

import { layoutStyles } from '../evalsLayout.stylex';
import { AdjudicationAccuracy } from './AdjudicationAccuracy.component';
import { AdjudicationCases } from './AdjudicationCases.component';
import { AdjudicationSpend } from './AdjudicationSpend.component';

export const EvalsAdjudications = () => {
  const data = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(layoutStyles.page)}>
      <PageHeader title='False-positive panel' />
      <Text size='sm' tone='secondary'>
        Every case the false-positive panel sat on, what its two judges and its
        adversary answered, and how often each model and prompt reached the true
        answer once one was recorded. A true answer comes from the repository
        owner, an upstream fix or a dismissal that was later reopened.
      </Text>
      {data.cases.total === 0 ? (
        <Text>No false-positive panel case is stored yet.</Text>
      ) : (
        <>
          <DescriptionList items={data.facts} />
          <AdjudicationCases cases={data.cases} reopened={data.reopened} />
          <AdjudicationAccuracy
            accuracy={data.accuracy}
            heatmap={data.heatmap}
            prompts={data.prompts}
            trend={data.trend}
          />
          <AdjudicationSpend
            builders={data.builders}
            costs={data.costs}
            rules={data.rules}
          />
        </>
      )}
    </div>
  );
};
