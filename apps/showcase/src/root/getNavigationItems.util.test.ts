import { describe, expect, it } from 'vite-plus/test';

import { getNavigationItems } from './getNavigationItems.util';

const labels = (isEvalsDashboardEnabled: boolean) =>
  getNavigationItems({ iconSize: 24, isEvalsDashboardEnabled }).map(
    (item) => item.label,
  );

describe('getNavigationItems', () => {
  it('lists Evals after Skill Scores when the dashboard flag is on', () => {
    const names = labels(true);

    expect(names).toContain('Evals');
    expect(names.indexOf('Evals')).toBe(names.indexOf('Skill Scores') + 1);
    expect(
      getNavigationItems({
        iconSize: 24,
        isEvalsDashboardEnabled: true,
      }).find((item) => item.label === 'Evals'),
    ).toMatchObject({ to: '/evals', type: 'link' });
  });

  it('leaves Evals out when the dashboard flag is off', () => {
    expect(labels(false)).not.toContain('Evals');
  });
});
