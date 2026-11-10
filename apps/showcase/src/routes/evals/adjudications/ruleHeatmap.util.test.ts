import { describe, expect, it } from 'vite-plus/test';

import { CASES, VERDICTS } from './adjudications.fixtures';
import { ruleHeatmap } from './ruleHeatmap.util';
import { scoredVerdicts } from './scoredVerdicts.util';

const RULE = 'lint/a11y/noNoninteractiveElementToInteractiveRole';

describe('ruleHeatmap', () => {
  const heatmap = ruleHeatmap(
    scoredVerdicts({ cases: CASES, verdicts: VERDICTS }),
  );

  it('puts the models down the side and the scored rules across', () => {
    expect(heatmap.rows).toEqual([
      { key: 'claude-fable-5-1', label: 'claude-fable-5-1' },
      { key: 'claude-opus-5-5', label: 'claude-opus-5-5' },
      { key: 'claude-sonnet-5-5', label: 'claude-sonnet-5-5' },
    ]);
    expect(heatmap.columns).toEqual([
      { key: `biome/${RULE}`, label: `biome: ${RULE}` },
      { key: 'fallow/complexity', label: 'fallow: complexity' },
    ]);
    expect(heatmap.title).toBe('Accuracy of 3 models over 2 rules');
  });

  it('tones each cell by the share of verdicts that reached the true answer', () => {
    expect(heatmap.cells.slice(0, 4)).toEqual([
      {
        column: `biome/${RULE}`,
        label: `claude-fable-5-1 on biome: ${RULE}: 50% (1/2)`,
        row: 'claude-fable-5-1',
        tone: 'warning',
      },
      {
        column: 'fallow/complexity',
        label: 'claude-fable-5-1 on fallow: complexity: 100% (1/1)',
        row: 'claude-fable-5-1',
        tone: 'success',
      },
      {
        column: `biome/${RULE}`,
        label: `claude-opus-5-5 on biome: ${RULE}: 50% (1/2)`,
        row: 'claude-opus-5-5',
        tone: 'warning',
      },
      {
        column: 'fallow/complexity',
        label: 'claude-opus-5-5 on fallow: complexity: 0% (0/1)',
        row: 'claude-opus-5-5',
        tone: 'error',
      },
    ]);
    expect(heatmap.cells).toHaveLength(6);
  });

  it('draws no cell for a model and rule with no scored verdict', () => {
    const unscored = ruleHeatmap(
      scoredVerdicts({ cases: CASES.slice(0, 1), verdicts: VERDICTS }),
    );

    expect(unscored).toEqual({
      cells: [],
      columns: [],
      rows: [],
      title: 'Accuracy of 0 models over 0 rules',
    });
  });
});
