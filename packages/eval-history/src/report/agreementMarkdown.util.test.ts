import { describe, expect, it } from 'vite-plus/test';

import { judgeAgreement } from '../grades/judgeAgreement.util.ts';
import { judgeAgreementLines } from '../grades/judgeAgreementLines.util.ts';
import { agreementMarkdown } from './agreementMarkdown.util.ts';
import {
  AGREEMENT_HEADING,
  AGREEMENT_NEEDS_DATABASE,
} from './report.constants.ts';

const thresholds = { minTrialsForRate: 2, z: 1.96 };

const judges = judgeAgreement({
  minN: thresholds.minTrialsForRate,
  rows: [
    {
      humanScore: 4,
      judgeModel: 'claude-opus-5-5',
      judgePromptHash: 'a'.repeat(64),
      judgeScore: 4,
    },
    {
      humanScore: 3,
      judgeModel: 'claude-opus-5-5',
      judgePromptHash: 'b'.repeat(64),
      judgeScore: 5,
    },
  ],
  z: thresholds.z,
});

describe('agreementMarkdown', () => {
  it('heads the section with what it covers, which is every recorded hand grade and not the two runs', () => {
    expect(
      agreementMarkdown({ agreement: { kind: 'needs-database' }, thresholds })
        .split('\n', 1)
        .at(0),
    ).toBe(
      '### Judge agreement (all recorded hand grades, by judge model and prompt hash)',
    );
  });

  it('prints the agreement lines under their heading, one paragraph per judge', () => {
    expect(
      agreementMarkdown({ agreement: { judges, kind: 'read' }, thresholds }),
    ).toBe(
      [
        AGREEMENT_HEADING,
        ...judgeAgreementLines({ judges, minN: 2, z: 1.96 }),
      ].join('\n\n'),
    );
  });

  it('prints the no-grades line when the database holds none', () => {
    expect(
      agreementMarkdown({
        agreement: { judges: [], kind: 'read' },
        thresholds,
      }),
    ).toContain('no hand grades yet');
  });

  it('says agreement needs the database instead of leaving the section out', () => {
    expect(
      agreementMarkdown({ agreement: { kind: 'needs-database' }, thresholds }),
    ).toBe(`${AGREEMENT_HEADING}\n\n${AGREEMENT_NEEDS_DATABASE}`);
  });
});
