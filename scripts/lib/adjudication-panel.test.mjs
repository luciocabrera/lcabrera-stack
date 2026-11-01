import { describe, expect, it } from 'vite-plus/test';

import {
  assertUnruled,
  DEFAULT_SEATS,
  dispatchPrompt,
  envelopeFor,
  listEntryFor,
  nextStep,
  outcomeOf,
  parseVerdict,
  resolvedModelProblems,
  seatProblems,
  seatsFrom,
  upstreamDraft,
  verdictFileName,
} from './adjudication-panel.mjs';

const verifier = (model, verdict = 'FALSE_POSITIVE') => ({ model, verdict });

const CASE_FILE = {
  case: {
    analyzer: 'fallow',
    case_id: 'FP-0002',
    content_hash: 'c'.repeat(64),
    created_at: '2026-10-30T10:00:00.000Z',
    file: 'a.ts',
    rule: 'code-duplication',
  },
  code: { context: '    4  const a = 1;', end: 9, start: 4 },
  finding: [{ fingerprint: 'dup:1' }],
};

describe('seats', () => {
  it('defaults to opus and sonnet judging and fable attacking', () => {
    const seats = [
      { model: 'opus', role: 'judge' },
      { model: 'sonnet', role: 'judge' },
      { model: 'fable', role: 'adversary' },
    ];
    expect(DEFAULT_SEATS).toEqual(seats);
    expect(seatsFrom({})).toEqual(seats);
  });

  it('takes the models it is given', () => {
    expect(seatsFrom({ adversary: 'c', judges: ['a', 'b'] })).toEqual([
      { model: 'a', role: 'judge' },
      { model: 'b', role: 'judge' },
      { model: 'c', role: 'adversary' },
    ]);
  });

  it('passes three distinct models with one differing from the builder', () => {
    expect(
      seatProblems({ builderModel: 'opus', seats: DEFAULT_SEATS }),
    ).toEqual([]);
  });

  it('refuses two seats on one model', () => {
    expect(
      seatProblems({
        builderModel: 'opus',
        seats: seatsFrom({ adversary: 'sonnet', judges: ['opus', 'sonnet'] }),
      }),
    ).toEqual([
      'the three seats need three distinct models; got opus, sonnet, sonnet',
    ]);
  });

  it.each([[undefined], ['  ']])(
    'refuses a panel whose builder model is %j',
    (builderModel) => {
      expect(seatProblems({ builderModel, seats: DEFAULT_SEATS })).toEqual([
        'name the builder model with --builder-model',
      ]);
    },
  );

  it("refuses a panel where every seat is the builder's model", () => {
    expect(
      seatProblems({
        builderModel: 'opus',
        seats: seatsFrom({ adversary: 'opus', judges: ['opus', 'opus'] }),
      }),
    ).toEqual([
      'the three seats need three distinct models; got opus, opus, opus',
      "at least one seat must run on a model other than the builder's",
    ]);
  });

  it('refuses resolved models that collide, or all match the builder', () => {
    expect(
      resolvedModelProblems({
        builderModel: 'm',
        verifiers: [verifier('x'), verifier('x'), verifier('y')],
      }),
    ).toEqual(['two seats resolved to the same model: x, x, y']);
    expect(
      resolvedModelProblems({
        builderModel: 'm',
        verifiers: [verifier('m'), verifier('m'), verifier('m')],
      }),
    ).toEqual([
      'two seats resolved to the same model: m, m, m',
      "every seat resolved to the builder's model m",
    ]);
    expect(
      resolvedModelProblems({
        builderModel: 'm',
        verifiers: [verifier('m'), verifier('n'), verifier('o')],
      }),
    ).toEqual([]);
  });
});

describe('assertUnruled', () => {
  it('refuses a case the panel already ruled on, so its record is never overwritten', () => {
    expect(() => assertUnruled({ caseId: 'FP-0002', ruled: true })).toThrow(
      'FP-0002 already has a panel record; open a new case with vp run adjudicate to adjudicate it again',
    );
  });

  it('lets an open case through', () => {
    expect(assertUnruled({ caseId: 'FP-0002', ruled: false })).toBeUndefined();
  });
});

describe('dispatchPrompt', () => {
  it('hands a seat the case path and nothing else about the finding', () => {
    const prompt = dispatchPrompt(
      'docs/agents/adjudications/FP-0002/case.json',
    );
    expect(prompt).toContain('docs/agents/adjudications/FP-0002/case.json');
    expect(
      prompt.replace('docs/agents/adjudications/FP-0002/case.json', ''),
    ).not.toMatch(/FP-\d|false positive|because/iu);
  });
});

describe('parseVerdict', () => {
  it('reads a FALSE_POSITIVE whose check names where it looked', () => {
    expect(
      parseVerdict(
        'FALSE_POSITIVE\nEvidence: read it.\nCheck: no caller passes user input; searched packages/x/src for query(.',
      ),
    ).toEqual({
      evidence:
        'Evidence: read it.\nCheck: no caller passes user input; searched packages/x/src for query(.',
      fixable: false,
      verdict: 'FALSE_POSITIVE',
    });
  });

  it('reads a REAL with a fix as fixable, and one with an empty fix as not', () => {
    expect(parseVerdict('REAL\nFix: extract a helper.')).toMatchObject({
      fixable: true,
      verdict: 'REAL',
    });
    expect(parseVerdict('REAL\nEvidence: real.\nFix:')).toMatchObject({
      fixable: false,
      verdict: 'REAL',
    });
  });

  it.each([
    [
      'a marker below line one',
      'Here is my verdict\nREAL\nFix: x',
      'line one is "Here is my verdict", not REAL or FALSE_POSITIVE',
    ],
    [
      'a FALSE_POSITIVE with no check',
      'FALSE_POSITIVE\nEvidence: trust me',
      'a FALSE_POSITIVE verdict needs a "Check:" line naming the file it looked in, as a path',
    ],
    [
      'a FALSE_POSITIVE whose check names no location',
      'FALSE_POSITIVE\nCheck: ran the trace and it was fine',
      'a FALSE_POSITIVE verdict needs a "Check:" line naming the file it looked in, as a path',
    ],
    [
      'a REAL with no fix line',
      'REAL\nEvidence: it is real',
      'a REAL verdict needs a line starting "Fix:"',
    ],
  ])('refuses %s', (_label, text, problem) => {
    expect(parseVerdict(text)).toEqual({ problem });
  });
});

describe('outcomeOf and nextStep', () => {
  const fp = verifier('a');
  const real = verifier('b', 'REAL');

  it.each([
    ['dismissed', false, [fp, verifier('c'), verifier('d')]],
    ['fixed', true, [real, fp, verifier('c')]],
    ['fixed', true, [real, verifier('c', 'REAL'), verifier('d', 'REAL')]],
    ['split', false, [real, fp, verifier('c')]],
    ['escalated', false, [real, verifier('c', 'REAL'), verifier('d', 'REAL')]],
  ])('rules %s when a fix is given: %s', (outcome, fixable, verifiers) => {
    expect(outcomeOf({ fixable, verifiers })).toBe(outcome);
  });

  it('sends a fixable REAL to the builder and the rest to the owner', () => {
    expect(nextStep('fixed')).toBe(
      'A REAL verdict gives a fix. Apply it; there is no marker. If the fix cannot be applied, stop and ask the repository owner.',
    );
    expect(nextStep('split')).toBe(
      'The panel split and no REAL verdict gives a fix. Stop and ask the repository owner; do not mark or dismiss it.',
    );
    expect(nextStep('escalated')).toBe(
      'The panel ruled REAL and gave no fix. Stop and ask the repository owner; do not mark or dismiss it.',
    );
  });
});

describe('records', () => {
  it('builds the envelope from the case and the verdicts', () => {
    const verifiers = [verifier('a'), verifier('b'), verifier('c')];
    expect(
      envelopeFor({ caseFile: CASE_FILE, fixable: false, verifiers }),
    ).toEqual({
      case: CASE_FILE.case,
      outcome: 'dismissed',
      schema_version: 1,
      verifiers,
    });
  });

  it('builds a list entry that expires six months after the case opened', () => {
    expect(
      listEntryFor({ caseFile: CASE_FILE, evidence: 'docs/x/FP-0002.json' }),
    ).toEqual({
      analyzer: 'fallow',
      case: 'FP-0002',
      contentHash: 'c'.repeat(64),
      evidence: 'docs/x/FP-0002.json',
      expires: '2027-04-30',
      file: 'a.ts',
      lines: 6,
      rule: 'code-duplication',
    });
  });

  it('names a verdict file after its seat, safely', () => {
    expect(verdictFileName({ model: 'claude/opus 5', role: 'judge' })).toBe(
      'judge-claude_opus_5.verdict.md',
    );
  });

  it('drafts an upstream report that says it is not posted', () => {
    const draft = upstreamDraft({
      caseFile: CASE_FILE,
      verifiers: [{ evidence: 'E', model: 'a', role: 'judge' }],
    });
    expect(draft).toBe(
      [
        '# Draft: fallow reports code-duplication on code it should not',
        '',
        "> Not posted. Nothing here goes to the analyzer's tracker without the repository owner's explicit yes.",
        '',
        '## The finding',
        '',
        '```json',
        '[\n  {\n    "fingerprint": "dup:1"\n  }\n]',
        '```',
        '',
        '## The code',
        '',
        '```',
        '    4  const a = 1;',
        '```',
        '',
        '## Why it is a false positive',
        '',
        '### judge (a)\n\nE\n',
      ].join('\n'),
    );
  });
});
