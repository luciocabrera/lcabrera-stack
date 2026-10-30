import { describe, expect, it } from 'vite-plus/test';

import { groundTruthRequest } from './groundTruthRequest.util.ts';

const USAGE =
  'name the case and its true answer: <case_id> <REAL|FALSE_POSITIVE>, or pass --accuracy';

type RequestArgs = Partial<Parameters<typeof groundTruthRequest>[0]> & {
  readonly positionals: readonly string[];
};

const request = (args: RequestArgs) =>
  groundTruthRequest({
    accuracy: false,
    note: undefined,
    source: undefined,
    ...args,
  });

describe('groundTruthRequest', () => {
  it('records the true answer under the default source when none is named', () => {
    expect(request({ positionals: ['FP-0001', 'FALSE_POSITIVE'] })).toEqual({
      caseId: 'FP-0001',
      kind: 'grade',
      note: undefined,
      source: 'lucio',
      truth: 'FALSE_POSITIVE',
    });
  });

  it('keeps the source and note it is given', () => {
    expect(
      request({
        note: 'fixed upstream in the rule',
        positionals: ['FP-0042', 'REAL'],
        source: 'upstream-fix',
      }),
    ).toEqual({
      caseId: 'FP-0042',
      kind: 'grade',
      note: 'fixed upstream in the rule',
      source: 'upstream-fix',
      truth: 'REAL',
    });
  });

  it('records a reopened dismissal as REAL', () => {
    expect(
      request({ positionals: ['FP-0003', 'REAL'], source: 'reopened' }),
    ).toMatchObject({
      kind: 'grade',
      source: 'reopened',
      truth: 'REAL',
    });
  });

  it('refuses a reopened dismissal recorded as FALSE_POSITIVE', () => {
    expect(
      request({
        positionals: ['FP-0003', 'FALSE_POSITIVE'],
        source: 'reopened',
      }),
    ).toEqual({
      kind: 'invalid',
      problems: ['a reopened dismissal is a real problem: record it as REAL'],
    });
  });

  it('prints accuracy alone when asked with no case', () => {
    expect(request({ accuracy: true, positionals: [] })).toEqual({
      kind: 'accuracy',
    });
  });

  it.each([[[]], [['FP-0001']], [['FP-0001', 'REAL', 'extra']]])(
    'asks for a case and a true answer when given %j',
    (positionals) => {
      expect(request({ positionals })).toEqual({
        kind: 'invalid',
        problems: [USAGE],
      });
    },
  );

  it('refuses --accuracy together with a case', () => {
    expect(
      request({ accuracy: true, positionals: ['FP-0001', 'REAL'] }),
    ).toEqual({
      kind: 'invalid',
      problems: [USAGE],
    });
  });

  it('names every problem with the arguments at once', () => {
    expect(
      request({
        note: '  ',
        positionals: ['case-1', 'real'],
        source: 'someone',
      }),
    ).toEqual({
      kind: 'invalid',
      problems: [
        'case case-1 is not a case id such as FP-0001',
        'true answer real is not REAL or FALSE_POSITIVE',
        '--source someone is not one of lucio, upstream-fix, reopened',
        '--note is blank',
      ],
    });
  });

  it.each(['FP-1', 'FP-0001x', 'xFP-0001'])(
    'refuses the case id %s',
    (caseId) => {
      expect(request({ positionals: [caseId, 'REAL'] })).toEqual({
        kind: 'invalid',
        problems: [`case ${caseId} is not a case id such as FP-0001`],
      });
    },
  );
});
