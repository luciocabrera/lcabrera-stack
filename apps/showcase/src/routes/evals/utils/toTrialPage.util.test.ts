import type { RunTrial } from '@repo/eval-history/queries/queries.types';

import { describe, expect, it } from 'vite-plus/test';

import { toTrialPage } from './toTrialPage.util';

const trial = {
  invoked: ['react-19', 'store-pattern'],
  taskKey: 'skills/react-19/trigger-1',
} as RunTrial;

describe('toTrialPage', () => {
  it('flattens the invoked skills into one cell and keeps the total', () => {
    expect(toTrialPage({ data: [trial], total: 9 })).toEqual({
      data: [{ ...trial, invoked: 'react-19, store-pattern' }],
      total: 9,
    });
  });

  it('keeps a trial that invoked nothing empty', () => {
    expect(
      toTrialPage({ data: [{ ...trial, invoked: undefined }], total: 1 })
        .data[0]?.invoked,
    ).toBeUndefined();
  });
});
