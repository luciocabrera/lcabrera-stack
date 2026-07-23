import { describe, expect, it } from 'vite-plus/test';

import { editScannerSchema } from './editScanner.schema';
import { toEditScannerFieldErrors } from './toEditScannerFieldErrors.util';

const validValues = {
  allowedTools: '',
  commandTemplate: '',
  configDetection: '',
  description: '',
  deterministic: false,
  displayName: 'Linter',
  isActive: true,
  rawArtifactFileName: '',
  stepsMarkdown: '',
  supportsDiffScope: false,
};

const parseErrors = (values: Readonly<Record<string, unknown>>) => {
  const parsed = editScannerSchema.safeParse(values);
  if (parsed.success) {
    throw new Error('Expected the fixture to fail validation.');
  }
  return toEditScannerFieldErrors({ error: parsed.error });
};

describe('toEditScannerFieldErrors', () => {
  it('surfaces a missing display name', () => {
    expect(parseErrors({ ...validValues, displayName: '' })).toEqual({
      configDetection: undefined,
      displayName: 'Display name is required.',
    });
  });

  it('surfaces invalid config detection JSON', () => {
    expect(
      parseErrors({ ...validValues, configDetection: '{nope' }).configDetection,
    ).toBe('Must be a valid JSON object (or empty).');
  });
});
