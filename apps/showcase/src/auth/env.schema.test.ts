import { describe, expect, it } from 'vite-plus/test';

import { readAuthEnvConfig } from './env.schema';

/** What a deployment must supply once the published defaults stop applying. */
const PRODUCTION_ENV = {
  AUTH_DEMO_PASSWORD_HASH: 'aa:bb',
  AUTH_TOKEN_SECRET: 'a-real-deployment-secret',
  NODE_ENV: 'production',
};

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
    for (const name of ['AUTH_TOKEN_SECRET', 'AUTH_DEMO_PASSWORD_HASH']) {
      const message = (() => {
        try {
          readAuthEnvConfig({ env: { ...PRODUCTION_ENV, [name]: undefined } });
          return '';
        } catch (error) {
          return error instanceof Error ? error.message : '';
        }
      })();

      expect(message).toContain(name);
      expect(
        message.matchAll(/AUTH_[A-Z_]+ must be set/gu).toArray(),
      ).toHaveLength(1);
    }
  });
});
