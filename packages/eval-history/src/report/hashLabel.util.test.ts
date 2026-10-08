import { describe, expect, it } from 'vite-plus/test';

import { hashLabel } from './hashLabel.util.ts';

describe('hashLabel', () => {
  it('names a run-wide hash in words', () => {
    expect(hashLabel('harness')).toBe('harness version');
    expect(hashLabel('catalog')).toBe('skill catalog hash');
    expect(hashLabel('model')).toBe('model');
  });

  it('names the subject whose content hash changed', () => {
    expect(hashLabel('content:skill/react-19')).toBe('`react-19` content hash');
  });

  it('names the task whose task, fixture or expected hash changed', () => {
    expect(hashLabel('task:skills/react-19/trigger-1')).toBe(
      '`skills/react-19/trigger-1` task hash',
    );
    expect(hashLabel('fixture:verifier-fixtures/f1')).toBe(
      '`verifier-fixtures/f1` fixture hash',
    );
  });

  it('returns a key it does not know as it is', () => {
    expect(hashLabel('unknown')).toBe('unknown');
  });
});
