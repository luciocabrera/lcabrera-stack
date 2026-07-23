/* eslint-disable unicorn/no-null -- DB registry rows use SQL NULL for nullable columns */
import type { ScannerRegistryRow } from '@repo/scan-ingestion/queries/getScannerById.util';

import { describe, expect, it } from 'vite-plus/test';

import { toEditScannerInitialValues } from './toEditScannerInitialValues.util';

const scanner: ScannerRegistryRow = {
  allowed_tools: null,
  command_template: null,
  config_detection: null,
  description: null,
  deterministic: true,
  display_name: 'Fallow',
  is_active: true,
  raw_artifact_file_name: null,
  scanner_id: 'fallow',
  skill_path: '.github/skills/fallow-code-checker',
  steps_markdown: null,
  supports_diff_scope: false,
  version: 3,
};

describe('toEditScannerInitialValues', () => {
  it('falls back to empty strings for every nullable column', () => {
    expect(toEditScannerInitialValues(scanner)).toEqual({
      allowedTools: '',
      commandTemplate: '',
      configDetection: '',
      description: '',
      deterministic: true,
      displayName: 'Fallow',
      isActive: true,
      rawArtifactFileName: '',
      stepsMarkdown: '',
      supportsDiffScope: false,
    });
  });

  it('joins allowed tools and pretty-prints config detection', () => {
    const populated: ScannerRegistryRow = {
      ...scanner,
      allowed_tools: ['Read', 'Grep'],
      command_template: 'run {target}',
      config_detection: { files: ['.fallowrc.json'] },
      description: 'Static analysis',
      raw_artifact_file_name: 'fallow.raw.json',
      steps_markdown: '# Steps',
    };

    const result = toEditScannerInitialValues(populated);

    expect(result.allowedTools).toBe('Read, Grep');
    expect(result.commandTemplate).toBe('run {target}');
    expect(result.configDetection).toBe(
      JSON.stringify({ files: ['.fallowrc.json'] }, undefined, 2),
    );
    expect(result.description).toBe('Static analysis');
    expect(result.rawArtifactFileName).toBe('fallow.raw.json');
    expect(result.stepsMarkdown).toBe('# Steps');
  });
});
