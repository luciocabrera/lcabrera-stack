import { describe, expect, it } from 'vite-plus/test';

import { reportTaskFixture } from './reportTaskFixture.util.ts';

describe('reportTaskFixture', () => {
  it('is a regression-set trigger task of one skill with no judge scores', () => {
    expect(reportTaskFixture()).toMatchObject({
      scores: [],
      set: 'regression',
      subject: { kind: 'skill', name: 'react-19' },
      taskKey: 'skills/react-19/trigger-1',
    });
  });

  it('takes what the caller overrides', () => {
    expect(reportTaskFixture({ set: 'capability' }).set).toBe('capability');
  });
});
