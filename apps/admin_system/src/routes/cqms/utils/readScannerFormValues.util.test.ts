import { describe, expect, it } from 'vitest';

import { readScannerFormValues } from './readScannerFormValues.util';

const buildFormData = (entries: Readonly<Record<string, string>>) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
};

describe('readScannerFormValues', () => {
  it('reads every shared field the authoring forms post', () => {
    const formData = buildFormData({
      allowedTools: 'Read,Grep',
      commandTemplate: 'vp run lint',
      configDetection: '{"files":["package.json"]}',
      description: 'Lints things',
      deterministic: 'on',
      displayName: 'Linter',
      rawArtifactFileName: 'lint.json',
      stepsMarkdown: '# Steps',
      supportsDiffScope: 'on',
    });

    expect(readScannerFormValues({ formData })).toEqual({
      allowedTools: 'Read,Grep',
      commandTemplate: 'vp run lint',
      configDetection: '{"files":["package.json"]}',
      description: 'Lints things',
      deterministic: true,
      displayName: 'Linter',
      rawArtifactFileName: 'lint.json',
      stepsMarkdown: '# Steps',
      supportsDiffScope: true,
    });
  });

  it('falls back to empty strings so the schema reports field errors', () => {
    expect(readScannerFormValues({ formData: new FormData() })).toEqual({
      allowedTools: '',
      commandTemplate: '',
      configDetection: '',
      description: '',
      deterministic: false,
      displayName: '',
      rawArtifactFileName: '',
      stepsMarkdown: '',
      supportsDiffScope: false,
    });
  });

  it('treats an absent checkbox as false rather than undefined', () => {
    const values = readScannerFormValues({
      formData: buildFormData({ displayName: 'Linter' }),
    });

    expect(values.deterministic).toBe(false);
    expect(values.supportsDiffScope).toBe(false);
  });
});
