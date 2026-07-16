import { describe, expect, it } from 'vitest';

import type { ScannerFieldValues } from './scannerFields.schema';

import { toScannerArtifactInput } from './toScannerArtifactInput.util';

const values: ScannerFieldValues = {
  allowedTools: 'Read, Grep',
  commandTemplate: 'vp run lint',
  configDetection: '',
  description: 'Lints things',
  deterministic: true,
  displayName: 'Linter',
  rawArtifactFileName: 'lint.json',
  stepsMarkdown: '# Steps',
  supportsDiffScope: false,
};

describe('toScannerArtifactInput', () => {
  it("maps the form values onto writeScannerArtifacts' arguments", () => {
    expect(toScannerArtifactInput({ scannerId: 'my-linter', values })).toEqual({
      allowedTools: ['Read', 'Grep'],
      description: 'Lints things',
      displayName: 'Linter',
      isDeterministic: true,
      rawArtifactFileName: 'lint.json',
      scannerId: 'my-linter',
      stepsMarkdown: '# Steps',
    });
  });

  it('turns blank optional text into undefined', () => {
    const input = toScannerArtifactInput({
      scannerId: 'my-linter',
      values: {
        ...values,
        allowedTools: '',
        description: '',
        rawArtifactFileName: '',
        stepsMarkdown: '',
      },
    });

    expect(input).toEqual({
      allowedTools: undefined,
      description: undefined,
      displayName: 'Linter',
      isDeterministic: true,
      rawArtifactFileName: undefined,
      scannerId: 'my-linter',
      stepsMarkdown: undefined,
    });
  });

  it('carries the scanner id through, since it is not a shared form field', () => {
    expect(
      toScannerArtifactInput({ scannerId: 'other-scanner', values }).scannerId,
    ).toBe('other-scanner');
  });
});
