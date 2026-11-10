import { describe, expect, it } from 'vite-plus/test';

import { ACCURACY, CASES, VERDICTS } from './adjudications.fixtures';
import { adjudicationsView } from './adjudicationsView.util';

describe('adjudicationsView', () => {
  it('derives every section of the page from the three reads', () => {
    const view = adjudicationsView({
      accuracy: ACCURACY,
      cases: CASES,
      verdicts: VERDICTS,
    });

    expect(Object.keys(view)).toEqual([
      'accuracy',
      'builders',
      'cases',
      'costs',
      'facts',
      'heatmap',
      'prompts',
      'reopened',
      'rules',
      'trend',
    ]);
    expect(view.accuracy).toHaveLength(2);
    expect(view.builders).toHaveLength(2);
    expect(view.cases.total).toBe(4);
    expect(view.costs).toHaveLength(3);
    expect(view.heatmap.cells).toHaveLength(6);
    expect(view.prompts).toHaveLength(3);
    expect(view.reopened).toHaveLength(1);
    expect(view.rules).toHaveLength(3);
    expect(view.trend).toHaveLength(3);
  });

  it('derives an empty page from an empty history', () => {
    const view = adjudicationsView({ accuracy: [], cases: [], verdicts: [] });

    expect(view.cases).toEqual({ rows: [], total: 0 });
    expect(view.heatmap.cells).toEqual([]);
    expect(view.trend).toEqual([]);
  });
});
