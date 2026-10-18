import { describe, expect, it } from 'vite-plus/test';

import { narrowedLine } from './narrowedLine.util.ts';

describe('narrowedLine', () => {
  it('prints nothing for a comparison of whole runs', () => {
    expect(narrowedLine([])).toEqual([]);
  });

  it('names every subject the comparison was narrowed to', () => {
    expect(narrowedLine(['react-19', 'unslop'])).toEqual([
      "Narrowed to `react-19`, `unslop`: only their tasks are compared, while cost and duration are each whole run's.",
    ]);
  });
});
