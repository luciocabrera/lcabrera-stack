import { describe, expect, it } from 'vite-plus/test';

import { buildRunnerScriptScaffold } from './buildRunnerScriptScaffold.util.ts';

describe('buildRunnerScriptScaffold', () => {
  it('wires the shared deterministic machinery around a TODO parser block', () => {
    const script = buildRunnerScriptScaffold({
      displayName: 'Cycle Finder',
      rawArtifactFileName: 'cycles.raw.json',
      scannerId: 'cycle-finder',
    });

    expect(script).toContain("from '@lcabrera/scan-report/deterministic-scan'");
    expect(script).toContain('TODO(parser)');
    expect(script).toContain('parseRunContext()');
    expect(script).toContain("rawFileName: 'cycles.raw.json'");
    expect(script).toContain("scannerId: 'cycle-finder'");
    expect(script).toContain('queue.constants.ts');
    // No unresolved generation-time interpolations may leak into the output.
    // Matched as regexes so the `${...}` needle is not itself a string that
    // reads as a template placeholder (Biome's noTemplateCurlyInString).
    expect(script).not.toMatch(/\$\{scannerId\}/);
    expect(script).not.toMatch(/\$\{rawFileName\}/);
  });

  it('defaults the raw artifact name to <scannerId>.raw.json', () => {
    const script = buildRunnerScriptScaffold({
      displayName: 'Bare',
      scannerId: 'bare-scanner',
    });

    expect(script).toContain("rawFileName: 'bare-scanner.raw.json'");
  });
});
