import { describe, expect, it } from 'vite-plus/test';

import {
  auditDidRun,
  classifyAdvisories,
  formatAdvisory,
  isAtLeast,
  readAdvisories,
} from './deps-audit.mjs';

const TODAY = '2026-08-04';

const advisory = (overrides = {}) => ({
  cwe: 'CWE-77',
  findings: [{ dev: true, optional: false, paths: ['.>lodash'], version: '1' }],
  github_advisory_id: 'GHSA-35jh-r3h4-6jhm',
  id: 1106913,
  module_name: 'lodash',
  patched_versions: '>=4.17.21',
  severity: 'high',
  title: 'Command Injection in lodash',
  url: 'https://github.com/advisories/GHSA-35jh-r3h4-6jhm',
  vulnerable_versions: '<4.17.21',
  ...overrides,
});

const report = (advisories = {}, totalDependencies = 1122) => ({
  advisories,
  metadata: { totalDependencies, vulnerabilities: {} },
});

describe('auditDidRun', () => {
  it('rejects a report that walked no dependencies', () => {
    expect(auditDidRun(report({}, 0))).toBe(false);
    expect(auditDidRun({ advisories: {} })).toBe(false);
    expect(auditDidRun({})).toBe(false);
    expect(auditDidRun()).toBe(false);
  });

  it('accepts a report that counted a real tree', () => {
    expect(auditDidRun(report())).toBe(true);
  });
});

describe('isAtLeast', () => {
  it('orders severities from info to critical', () => {
    expect(isAtLeast({ minimum: 'moderate', severity: 'critical' })).toBe(true);
    expect(isAtLeast({ minimum: 'moderate', severity: 'moderate' })).toBe(true);
    expect(isAtLeast({ minimum: 'moderate', severity: 'low' })).toBe(false);
  });

  it('treats an unknown severity as the most severe', () => {
    expect(isAtLeast({ minimum: 'critical', severity: 'catastrophic' })).toBe(
      true,
    );
  });
});

describe('readAdvisories', () => {
  it('keys on the GHSA id, not the registry-assigned number', () => {
    const [found] = readAdvisories(report({ 1106913: advisory() }));
    expect(found.ghsa).toBe('GHSA-35jh-r3h4-6jhm');
  });

  it('falls back to a marked pnpm id when no GHSA is given', () => {
    const [found] = readAdvisories(
      report({ 1: advisory({ github_advisory_id: undefined }) }),
    );
    expect(found.ghsa).toBe('pnpm-1106913');
  });

  it('marks production when any finding is on a runtime path', () => {
    const [found] = readAdvisories(
      report({
        1: advisory({
          findings: [{ dev: true }, { dev: false }],
        }),
      }),
    );
    expect(found.production).toBe(true);
  });

  it('is dev-only when no finding is', () => {
    const [found] = readAdvisories(report({ 1: advisory() }));
    expect(found.production).toBe(false);
  });

  it('sorts most severe first so the worst is read first', () => {
    const found = readAdvisories(
      report({
        1: advisory({ github_advisory_id: 'GHSA-aaa', severity: 'moderate' }),
        2: advisory({ github_advisory_id: 'GHSA-bbb', severity: 'critical' }),
      }),
    );
    expect(found.map((entry) => entry.severity)).toEqual([
      'critical',
      'moderate',
    ]);
  });

  it('reads an empty report as no advisories', () => {
    expect(readAdvisories(report())).toEqual([]);
    expect(readAdvisories({})).toEqual([]);
  });
});

describe('classifyAdvisories', () => {
  const advisories = readAdvisories(report({ 1: advisory() }));

  it('blocks an advisory with no allowance', () => {
    const { blocking } = classifyAdvisories({ advisories, today: TODAY });
    expect(blocking).toHaveLength(1);
    expect(blocking[0].why).toBe('not allowed');
  });

  it('carries one with a live allowance', () => {
    const { blocking, carried } = classifyAdvisories({
      advisories,
      allowances: [{ expires: '2026-12-31', ghsa: 'GHSA-35jh-r3h4-6jhm' }],
      today: TODAY,
    });
    expect(blocking).toHaveLength(0);
    expect(carried).toHaveLength(1);
  });

  it('blocks again once the allowance has expired', () => {
    const { blocking } = classifyAdvisories({
      advisories,
      allowances: [{ expires: '2026-08-03', ghsa: 'GHSA-35jh-r3h4-6jhm' }],
      today: TODAY,
    });
    expect(blocking[0].why).toContain('expired');
  });

  it('treats the expiry date itself as still live', () => {
    const { blocking } = classifyAdvisories({
      advisories,
      allowances: [{ expires: TODAY, ghsa: 'GHSA-35jh-r3h4-6jhm' }],
      today: TODAY,
    });
    expect(blocking).toHaveLength(0);
  });

  it('refuses an allowance with no date', () => {
    const { blocking } = classifyAdvisories({
      advisories,
      allowances: [{ ghsa: 'GHSA-35jh-r3h4-6jhm' }],
      today: TODAY,
    });
    expect(blocking[0].why).toContain('no date');
  });

  it('reports an allowance matching nothing in the tree', () => {
    const { stale } = classifyAdvisories({
      advisories,
      allowances: [
        { expires: '2026-12-31', ghsa: 'GHSA-35jh-r3h4-6jhm' },
        { expires: '2026-12-31', ghsa: 'GHSA-gone-gone-gone' },
      ],
      today: TODAY,
    });
    expect(stale.map((entry) => entry.ghsa)).toEqual(['GHSA-gone-gone-gone']);
  });

  it('counts a sub-floor advisory as ignored rather than dropping it', () => {
    const low = readAdvisories(report({ 1: advisory({ severity: 'low' }) }));
    const { blocking, ignored } = classifyAdvisories({
      advisories: low,
      minimumSeverity: 'moderate',
      today: TODAY,
    });
    expect(blocking).toHaveLength(0);
    expect(ignored).toHaveLength(1);
  });

  it('raises the floor on request', () => {
    const { blocking, ignored } = classifyAdvisories({
      advisories,
      minimumSeverity: 'critical',
      today: TODAY,
    });
    expect(blocking).toHaveLength(0);
    expect(ignored).toHaveLength(1);
  });
});

describe('formatAdvisory', () => {
  it('names the runtime path, since that is what changes the decision', () => {
    const [dev] = readAdvisories(report({ 1: advisory() }));
    const [prod] = readAdvisories(
      report({ 1: advisory({ findings: [{ dev: false }] }) }),
    );
    expect(formatAdvisory(dev)).not.toContain('[production path]');
    expect(formatAdvisory(prod)).toContain('[production path]');
    expect(formatAdvisory(prod)).toContain('GHSA-35jh-r3h4-6jhm');
  });
});
