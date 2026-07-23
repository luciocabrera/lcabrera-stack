import { describe, expect, it } from 'vite-plus/test';

import { isSecretFilePath } from './isSecretFilePath.util.ts';

describe('isSecretFilePath', () => {
  it.each([
    '.env',
    '.env.local',
    '.env.production',
    'docker/local/.env',
    '/abs/path/.env.staging',
    'dev.env',
    '.envrc',
    '.npmrc',
    '.netrc',
    '.pgpass',
    '.git-credentials',
    '.dockercfg',
    'credentials',
    'credentials.json',
    '~/.aws/credentials',
    'id_rsa',
    'id_rsa.pub',
    'id_ed25519',
    'server.pem',
    'private.key',
    'bundle.p12',
    'cert.pfx',
  ])('flags %s as secret', (path) => {
    expect(isSecretFilePath(path)).toBe(true);
  });

  it.each([
    '.env.example',
    '.env.sample',
    '.env.template',
    'docker/local/.env.example',
    'src/app.ts',
    'README.md',
    'package.json',
    'environment.ts',
    'src/env.schema.ts',
    'keyboard.ts',
    'monkey.test.ts',
    '',
  ])('allows %s', (path) => {
    expect(isSecretFilePath(path)).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isSecretFilePath('.ENV')).toBe(true);
    expect(isSecretFilePath('ID_RSA')).toBe(true);
  });
});
