import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-compare.loader';

import { EvalsPageHeader } from '../EvalsPageHeader';
import { ComparePicker } from './ComparePicker.component';
import { CompareReport } from './CompareReport.component';
import { styles } from './EvalsCompare.stylex';

export const EvalsCompare = () => {
  const { choices, comparison } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.page)}>
      <EvalsPageHeader title='Compare runs' trail='compare' />
      {comparison === undefined ? (
        <ComparePicker choices={choices} />
      ) : (
        <CompareReport comparison={comparison} />
      )}
    </div>
  );
};
