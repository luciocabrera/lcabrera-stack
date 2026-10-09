import { describe, expect, it } from 'vite-plus/test';

import { authorOf } from './authorOf.util.ts';

describe('authorOf', () => {
  it('names the GitHub actor under Actions', () => {
    expect(
      authorOf({
        email: 'lucio@example.com',
        env: { GITHUB_ACTOR: 'octocat' },
        user: 'runner',
      }),
    ).toBe('octocat');
  });

  it("falls back to the local part of git's user.email", () => {
    expect(
      authorOf({ email: 'lucio@example.com', env: {}, user: 'runner' }),
    ).toBe('lucio');
  });

  it('falls back to the operating-system user without an email', () => {
    expect(authorOf({ email: undefined, env: {}, user: 'runner' })).toBe(
      'runner',
    );
  });
});
