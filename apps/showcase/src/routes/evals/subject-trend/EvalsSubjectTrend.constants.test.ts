import { describe, expect, it } from 'vite-plus/test';

import { routeMatch } from '../utils/pageHeader.fixtures';
import { EVALS_SUBJECT_TREND_HANDLE } from './EvalsSubjectTrend.constants';

describe('the subject trend breadcrumb', () => {
  it('names the subject kind the route matched, after a link to the overview', () => {
    expect(
      EVALS_SUBJECT_TREND_HANDLE.breadcrumb(
        routeMatch({
          params: { kind: 'skill', name: 'react-19' },
          pathname: '/evals/subjects/skill/react-19',
        }),
      ),
    ).toEqual([{ label: 'Evals', to: '/evals' }, { label: 'skill trend' }]);
  });

  it('names no kind when the route matched none', () => {
    expect(
      EVALS_SUBJECT_TREND_HANDLE.breadcrumb(
        routeMatch({ params: {}, pathname: '/' }),
      )[1],
    ).toEqual({
      label: ' trend',
    });
  });
});
