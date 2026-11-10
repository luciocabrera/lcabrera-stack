import { describe, expect, it } from 'vite-plus/test';

import { VERDICTS } from './adjudications.fixtures';
import { panelTally } from './panelTally.util';

describe('panelTally', () => {
  it('counts each verdict the seats gave, in a fixed order', () => {
    expect(
      panelTally(VERDICTS.filter(({ caseId }) => caseId === 'FP-0002')),
    ).toBe('2 FALSE_POSITIVE, 1 REAL');
    expect(
      panelTally(VERDICTS.filter(({ caseId }) => caseId === 'FP-0004')),
    ).toBe('3 REAL');
  });

  it('says so when a case has no verdict', () => {
    expect(panelTally([])).toBe('no verdict');
  });
});
