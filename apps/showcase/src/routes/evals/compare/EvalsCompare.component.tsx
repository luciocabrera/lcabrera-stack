import { PageHeader } from '@lcabrera/ui';
import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-compare.loader';

import { pageStyles } from '../evalsPage.stylex';
import { ComparePicker } from './ComparePicker.component';
import { CompareReport } from './CompareReport.component';

export const EvalsCompare = () => {
  const { choices, comparison } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(pageStyles.page)}>
      <PageHeader title='Compare runs' />
      {comparison === undefined ? (
        <ComparePicker choices={choices} />
      ) : (
        <CompareReport comparison={comparison} />
      )}
    </div>
  );
};
