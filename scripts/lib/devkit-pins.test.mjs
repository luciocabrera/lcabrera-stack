import { describe, expect, it } from 'vite-plus/test';

import { withEmittedPins } from './devkit-pins.mjs';

const SOURCE = `export const NODE_VERSION = '26.8.1';

export const PACKAGE_MANAGER =
  'pnpm@11.25.0+sha256.33dd0748f27e7916c4f1c8b6943461983e3453b06bbda6312a6280130b4881e5';

export const OTHER = 'untouched';
`;

const PINS = {
  nodeVersion: '26.8.2',
  packageManager:
    'pnpm@12.3.4+sha256.08a3d2d539b377a6b7ea2469b612672255ca71c30a62698530582cb9d35c268f',
};

describe('withEmittedPins', () => {
  it('rewrites both constants and nothing else', () => {
    const synced = withEmittedPins({ ...PINS, source: SOURCE });

    expect(synced).toContain(`NODE_VERSION = '26.8.2'`);
    expect(synced).toContain(`'${PINS.packageManager}'`);
    expect(synced).not.toContain('26.8.1');
    expect(synced).not.toContain('pnpm@11');
    expect(synced).toContain(`export const OTHER = 'untouched'`);
  });

  it('is the identity when the source already holds the pins', () => {
    const synced = withEmittedPins({ ...PINS, source: SOURCE });

    expect(withEmittedPins({ ...PINS, source: synced })).toBe(synced);
  });

  it('refuses a source where a constant was renamed away', () => {
    const renamed = SOURCE.replace('PACKAGE_MANAGER', 'PNPM_PIN');

    expect(() => withEmittedPins({ ...PINS, source: renamed })).toThrow(
      /PACKAGE_MANAGER/u,
    );
  });
});
