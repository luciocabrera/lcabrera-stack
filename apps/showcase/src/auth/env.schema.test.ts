import { describe, expect, it } from 'vite-plus/test';

import { readAuthEnvConfig } from './env.schema';

const PRODUCTION_ENV = {
  AUTH_DEMO_PASSWORD_HASH: 'aa:bb',
  AUTH_TOKEN_SECRET: 'a-real-deployment-secret',
  NODE_ENV: 'production',
};

const messageFor = (env: NodeJS.ProcessEnv) => {
  try {
    readAuthEnvConfig({ env });
    return '';
  } catch (error) {
    return error instanceof Error ? error.message : '';
  }
};

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
    expect(
      readAuthEnvConfig({ env: { NODE_ENV: 'test' } }).AUTH_TOKEN_SECRET,
    ).toMatch(/dev-insecure/);
  });

  it('refuses every mode that is not development or test', () => {
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
    for (const name of ['AUTH_TOKEN_SECRET', 'AUTH_DEMO_PASSWORD_HASH']) {
      const message = messageFor({ ...PRODUCTION_ENV, [name]: '' });

      expect(refusalsIn(message)).toEqual([`${name} must be set`]);
    }
  });

  it('names its own variable when a development value is blank', () => {
    for (const name of ['AUTH_TOKEN_SECRET', 'AUTH_DEMO_PASSWORD_HASH']) {
      const message = messageFor({ [name]: '', NODE_ENV: 'development' });

      expect(message).toContain(`${name} is set but empty`);
    }

    expect(
      readAuthEnvConfig({ env: { NODE_ENV: 'development' } }).AUTH_TOKEN_SECRET,
    ).toMatch(/dev-insecure/);
  });

  it('spells the permitted modes from the set that accepts them', () => {
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
    expect(readAuthEnvConfig({ env: PRODUCTION_ENV }).AUTH_DEMO_EMAIL).toBe(
      'demo@example.com',
    );
  });

  it('names its own variable in each refusal', () => {
    for (const name of ['AUTH_TOKEN_SECRET', 'AUTH_DEMO_PASSWORD_HASH']) {
      const message = messageFor({ ...PRODUCTION_ENV, [name]: undefined });

      expect(refusalsIn(message)).toEqual([`${name} must be set`]);
    }
  });
});
