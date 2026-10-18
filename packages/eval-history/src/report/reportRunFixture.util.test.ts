import { describe, expect, it } from 'vite-plus/test';

import {
  reportRunFixture,
  reportTaskFixture,
} from './reportRunFixture.util.ts';

describe('reportRunFixture', () => {
  it('is a complete run on main with one task', () => {
    expect(reportRunFixture()).toMatchObject({
      branch: 'main',
      status: 'complete',
      tasks: [{ taskKey: 'skills/react-19/trigger-1' }],
    });
  });

  it('takes what the caller overrides', () => {
    expect(
      reportRunFixture({ branch: 'feat/x', modelId: undefined }),
    ).toMatchObject({
      branch: 'feat/x',
      modelId: undefined,
    });
  });

  it('builds a regression-set task of one skill, overridable', () => {
    expect(reportTaskFixture({ set: 'capability' })).toMatchObject({
      scores: [],
      set: 'capability',
      subject: { kind: 'skill', name: 'react-19' },
      taskKey: 'skills/react-19/trigger-1',
    });
  });
});
