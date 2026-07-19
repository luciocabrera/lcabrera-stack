import { describe, expect, it } from 'vitest';

import { readAuthEnvConfig } from './env.schema';

describe('readAuthEnvConfig', () => {
  it('applies dev defaults when nothing is set', () => {
    const config = readAuthEnvConfig({ env: {} });

    expect(config.AUTH_DEMO_EMAIL).toBe('demo@example.com');
    expect(config.AUTH_TOKEN_SECRET).toMatch(/dev-insecure/);
    expect(config.AUTH_DEMO_PASSWORD_HASH).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('honors provided overrides', () => {
    const config = readAuthEnvConfig({
      env: {
        AUTH_DEMO_EMAIL: 'ops@corp.test',
        AUTH_TOKEN_SECRET: 'prod-secret',
      },
    });

    expect(config.AUTH_DEMO_EMAIL).toBe('ops@corp.test');
    expect(config.AUTH_TOKEN_SECRET).toBe('prod-secret');
  });
});
