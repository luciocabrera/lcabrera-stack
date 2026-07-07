import { describe, expect, it } from 'vitest';

import { buildRunnerScriptScaffold } from './buildRunnerScriptScaffold.util.ts';

describe('buildRunnerScriptScaffold', () => {
  it('wires the shared deterministic machinery around a TODO parser block', () => {
    const script = buildRunnerScriptScaffold({
      displayName: 'Cycle Finder',
      rawArtifactFileName: 'cycles.raw.json',
      scannerId: 'cycle-finder',
    });

    expect(script).toContain(
      "from '../../code-smell-shared/scripts/deterministic-scan-shared.mjs'",
    );
    expect(script).toContain('TODO(parser)');
    expect(script).toContain("parseRunContext('.')");
    expect(script).toContain("rawFileName: 'cycles.raw.json'");
    expect(script).toContain("scannerId: 'cycle-finder'");
    expect(script).toContain('deterministicScannerConfigs.constants.ts');
    // No unresolved generation-time interpolations may leak into the output.
    expect(script).not.toContain('${scannerId}');
    expect(script).not.toContain('${rawFileName}');
  });

  it('defaults the raw artifact name to <scannerId>.raw.json', () => {
    const script = buildRunnerScriptScaffold({
      displayName: 'Bare',
      scannerId: 'bare-scanner',
    });

    expect(script).toContain("rawFileName: 'bare-scanner.raw.json'");
  });
});
