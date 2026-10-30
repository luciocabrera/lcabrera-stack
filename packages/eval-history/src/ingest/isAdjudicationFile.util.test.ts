import { describe, expect, it } from 'vite-plus/test';

import { isAdjudicationFile } from './isAdjudicationFile.util.ts';

describe('isAdjudicationFile', () => {
  it.each(['docs/agents/adjudications/FP-0001.json', 'FP-12345.json'])(
    'reads %s as a case file',
    (file) => {
      expect(isAdjudicationFile(file)).toBe(true);
    },
  );

  it.each([
    '.tmp/eval-results/skills/4e5aa14f-79b7-452d-be7c-66bdff258a25.json',
    'FP-1.json',
    'FP-0001.json/notes.txt',
    'FP-0001/case.json',
    'fp-0001.json',
  ])('reads %s as a run envelope', (file) => {
    expect(isAdjudicationFile(file)).toBe(false);
  });
});
