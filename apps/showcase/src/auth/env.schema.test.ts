import { describe, expect, it } from 'vite-plus/test';

import { readAuthEnvConfig } from './env.schema';

/** What a deployment must supply once the published defaults stop applying. */
const PRODUCTION_ENV = {
  AUTH_DEMO_PASSWORD_HASH: 'aa:bb',
  AUTH_TOKEN_SECRET: 'a-real-deployment-secret',
  NODE_ENV: 'production',
};

/** The message a refused parse threw, or `''` when it did not refuse. */
const messageFor = (env: NodeJS.ProcessEnv) => {
  try {
    readAuthEnvConfig({ env });
    return '';
  } catch (error) {
    return error instanceof Error ? error.message : '';
  }
};

/** Only the `AUTH_… must be set` phrases in a message, in order. */
const refusalsIn = (message: string) =>
  message
    .matchAll(/AUTH_[A-Z_]+ must be set/gu)
    .map(([refusal]) => refusal)
    .toArray();

describe('readAuthEnvConfig', () => {
  it('applies dev defaults in development', () => {
    const config = readAuthEnvConfig({ env: { NODE_ENV: 'development' } });

    expect(config.AUTH_DEMO_EMAIL).toBe('demo@example.com');
    expect(config.AUTH_TOKEN_SECRET).toMatch(/dev-insecure/);
    expect(config.AUTH_DEMO_PASSWORD_HASH).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('applies dev defaults under test', () => {
    // Asserted separately from `development` because this is the mode the suite
    // itself runs in: folding the two together would let a guard permitting only
    // `development` pass here on the runner's env rather than on the code.
    expect(
      readAuthEnvConfig({ env: { NODE_ENV: 'test' } }).AUTH_TOKEN_SECRET,
    ).toMatch(/dev-insecure/);
  });

  it('refuses every mode that is not development or test', () => {
    // Why the guard tests the permitted values instead of `production`, pinned
    // so it cannot quietly go back: an unset `NODE_ENV` is what
    // `node build/server/index.js` starts with, and `staging` is nobody's
    // development machine. Both once got the published secret handed back.
    for (const NODE_ENV of [undefined, 'staging', 'Production', 'production']) {
      expect(() => readAuthEnvConfig({ env: { NODE_ENV } })).toThrow(
        /AUTH_TOKEN_SECRET must be set/,
      );
    }
  });

  it('honors provided overrides', () => {
    const config = readAuthEnvConfig({
      env: {
        AUTH_DEMO_EMAIL: 'ops@corp.test',
        AUTH_TOKEN_SECRET: 'prod-secret',
        NODE_ENV: 'development',
      },
    });

    expect(config.AUTH_DEMO_EMAIL).toBe('ops@corp.test');
    expect(config.AUTH_TOKEN_SECRET).toBe('prod-secret');
  });

  it('refuses to start in production without the token secret', () => {
    expect(() =>
      readAuthEnvConfig({
        env: { ...PRODUCTION_ENV, AUTH_TOKEN_SECRET: undefined },
      }),
    ).toThrow(/AUTH_TOKEN_SECRET must be set unless NODE_ENV is development/);
  });

  it('refuses to start in production without the demo password hash', () => {
    expect(() =>
      readAuthEnvConfig({
        env: { ...PRODUCTION_ENV, AUTH_DEMO_PASSWORD_HASH: undefined },
      }),
    ).toThrow(
      /AUTH_DEMO_PASSWORD_HASH must be set unless NODE_ENV is development/,
    );
  });

  it('names its own variable when the value is set but blank', () => {
    // The shape a deploy platform produces when it declares a variable and
    // leaves it empty. `.min(1)` rejects it on its own terms — "Too small:
    // expected string to have >=1 characters" — which names nothing, so the
    // refusal message has to be on the length check as well as the type.
    for (const name of ['AUTH_TOKEN_SECRET', 'AUTH_DEMO_PASSWORD_HASH']) {
      const message = messageFor({ ...PRODUCTION_ENV, [name]: '' });

      expect(refusalsIn(message)).toEqual([`${name} must be set`]);
    }
  });

  it('names its own variable when a development value is blank', () => {
    // The two cases behave OPPOSITELY on this branch, which is the point: a
    // missing value takes the published default — that is what development mode
    // is for — while a blank one is refused. Without a message on the length
    // check the refusal is Zod's nameless "Too small", which is exactly the
    // failure this change exists to remove, in the one mode a local env file is
    // actually read in.
    for (const name of ['AUTH_TOKEN_SECRET', 'AUTH_DEMO_PASSWORD_HASH']) {
      const message = messageFor({ [name]: '', NODE_ENV: 'development' });

      expect(message).toContain(`${name} is set but empty`);
    }

    expect(
      readAuthEnvConfig({ env: { NODE_ENV: 'development' } }).AUTH_TOKEN_SECRET,
    ).toMatch(/dev-insecure/);
  });

  it('spells the permitted modes from the set that accepts them', () => {
    // Two copies of "development or test" — one in the guard, one in the prose —
    // is the drift AGENTS.md §7 is most insistent about, so the message is built
    // from the set. This fails if someone adds a mode and not the wording.
    const message = messageFor({
      ...PRODUCTION_ENV,
      AUTH_TOKEN_SECRET: undefined,
    });

    for (const mode of ['development', 'test']) {
      expect(readAuthEnvConfig({ env: { NODE_ENV: mode } })).toBeDefined();
      expect(message).toContain(mode);
    }
  });

  it('accepts production once both are supplied', () => {
    const config = readAuthEnvConfig({ env: PRODUCTION_ENV });

    expect(config.AUTH_TOKEN_SECRET).toBe('a-real-deployment-secret');
    expect(config.AUTH_DEMO_PASSWORD_HASH).toBe('aa:bb');
  });

  it('keeps the demo email default in production', () => {
    // Not a credential, so withholding it would be friction with no gain. Pinned
    // because "guard the auth vars" invites sweeping this one in with them.
    expect(readAuthEnvConfig({ env: PRODUCTION_ENV }).AUTH_DEMO_EMAIL).toBe(
      'demo@example.com',
    );
  });

  it('names its own variable in each refusal', () => {
    // The schema cannot see the key it was assigned to, so the name is passed in
    // and could be passed wrong — a copy-paste would report the other variable
    // and send a deployment to set something that is already set.
    //
    // Asserted on the name the message CARRIES, not on that name appearing:
    // `ZodError.message` is a JSON dump of the issues and each one already holds
    // `"path": ["AUTH_…"]`, so a presence check passes on a swap via the path
    // alone and this test could never fail the way its own comment claims.
    // Swapping the two `name:` values in `env.schema.ts` fails the line below.
    for (const name of ['AUTH_TOKEN_SECRET', 'AUTH_DEMO_PASSWORD_HASH']) {
      const message = messageFor({ ...PRODUCTION_ENV, [name]: undefined });

      expect(refusalsIn(message)).toEqual([`${name} must be set`]);
    }
  });
});
