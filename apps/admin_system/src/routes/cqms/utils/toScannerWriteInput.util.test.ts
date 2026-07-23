import { describe, expect, it } from 'vite-plus/test';

import type { ScannerFieldValues } from './scannerFields.schema';

import { toScannerWriteInput } from './toScannerWriteInput.util';

const values: ScannerFieldValues = {
  allowedTools: 'Read, Grep',
  commandTemplate: 'vp run lint',
  configDetection: '{"files":["package.json"]}',
  description: 'Lints things',
  deterministic: true,
  displayName: 'Linter',
  rawArtifactFileName: 'lint.json',
  stepsMarkdown: '# Steps',
  supportsDiffScope: false,
};

describe('toScannerWriteInput', () => {
  it('maps the form values onto the snake_case scanner row', () => {
    expect(toScannerWriteInput({ values })).toEqual({
      allowed_tools: ['Read', 'Grep'],
      command_template: 'vp run lint',
      config_detection: { files: ['package.json'] },
      description: 'Lints things',
      deterministic: true,
      display_name: 'Linter',
      raw_artifact_file_name: 'lint.json',
      steps_markdown: '# Steps',
      supports_diff_scope: false,
    });
  });

  it('turns blank optional text into undefined, so the column stays unset', () => {
    const input = toScannerWriteInput({
      values: {
        ...values,
        allowedTools: '',
        commandTemplate: '',
        configDetection: '',
        description: '',
        rawArtifactFileName: '',
        stepsMarkdown: '',
      },
    });

    expect(input).toEqual({
      allowed_tools: undefined,
      command_template: undefined,
      config_detection: undefined,
      description: undefined,
      deterministic: true,
      display_name: 'Linter',
      raw_artifact_file_name: undefined,
      steps_markdown: undefined,
      supports_diff_scope: false,
    });
  });

  it('keeps required fields even when everything optional is blank', () => {
    const input = toScannerWriteInput({
      values: { ...values, description: '' },
    });

    expect(input.display_name).toBe('Linter');
    expect(input.deterministic).toBe(true);
  });
});
