import { describe, expect, it } from 'vite-plus/test';

import { adjudication, CASES } from './adjudications.fixtures';
import { reopenedDismissals } from './reopenedDismissals.util';

describe('reopenedDismissals', () => {
  it('lists each dismissed case whose latest true answer reopened it', () => {
    expect(reopenedDismissals(CASES)).toEqual([
      {
        caseId: 'FP-0003',
        label:
          'FP-0003: biome lint/a11y/noNoninteractiveElementToInteractiveRole, dismissed by the panel on 2026-11-03, then reopened as REAL',
      },
    ]);
  });

  it('leaves out a reopened answer on a case the panel did not dismiss', () => {
    expect(
      reopenedDismissals([
        adjudication({
          caseId: 'FP-0005',
          outcome: 'split',
          truth: 'REAL',
          truthSource: 'reopened',
        }),
      ]),
    ).toEqual([]);
  });
});
