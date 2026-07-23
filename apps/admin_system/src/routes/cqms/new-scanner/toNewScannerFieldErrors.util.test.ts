import { describe, expect, it } from 'vite-plus/test';

import { newScannerSchema } from './newScanner.schema';
import { toNewScannerFieldErrors } from './toNewScannerFieldErrors.util';

const validValues = {
  allowedTools: '',
  commandTemplate: '',
  configDetection: '',
  description: '',
  deterministic: false,
  displayName: 'Linter',
  rawArtifactFileName: '',
  scannerId: 'my-linter',
  stepsMarkdown: '',
  supportsDiffScope: false,
};

const parseErrors = (values: Readonly<Record<string, unknown>>) => {
  const parsed = newScannerSchema.safeParse(values);
  if (parsed.success) {
    throw new Error('Expected the fixture to fail validation.');
  }
  return toNewScannerFieldErrors({ error: parsed.error });
};

describe('toNewScannerFieldErrors', () => {
  it('surfaces the scanner id format message', () => {
    expect(parseErrors({ ...validValues, scannerId: 'Not Kebab' })).toEqual({
      configDetection: undefined,
      displayName: undefined,
      scannerId: 'Lowercase kebab-case, max 48 chars (e.g. my-scanner).',
    });
  });

  it('surfaces a missing display name', () => {
    expect(parseErrors({ ...validValues, displayName: '' }).displayName).toBe(
      'Display name is required.',
    );
  });

  it('surfaces invalid config detection JSON', () => {
    expect(
      parseErrors({ ...validValues, configDetection: '{nope' }).configDetection,
    ).toBe('Must be a valid JSON object (or empty).');
  });

  it('reports every failing field at once', () => {
    expect(
      parseErrors({ ...validValues, displayName: '', scannerId: 'Nope!' }),
    ).toEqual({
      configDetection: undefined,
      displayName: 'Display name is required.',
      scannerId: 'Lowercase kebab-case, max 48 chars (e.g. my-scanner).',
    });
  });
});
