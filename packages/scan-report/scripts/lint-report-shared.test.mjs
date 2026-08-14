// Pins `top_risk`'s precedence, rewritten out of a nested ternary (Sonar
// S3358). It is a report.json field, so the three branches and their exact
// wording are the contract, not an implementation detail.

import { describe, expect, test } from 'vite-plus/test';

import { buildReport } from './lint-report-shared.mjs';

const report = (overrides) =>
  buildReport({
    filesAnalyzed: 1,
    findings: [],
    reportIdPrefix: 'oxlint',
    timestamp: 't',
    toolFailures: [],
    ...overrides,
  });

const finding = (ruleId) => ({ rule_id: ruleId, severity: 'HIGH' });

describe('top_risk', () => {
  test('names the most frequent rule and its count when there are findings', () => {
    expect(
      report({ findings: [finding('eqeqeq'), finding('eqeqeq')] }).top_risk,
    ).toBe(
      '`eqeqeq` reported 2 time(s) — the most frequent lint violation in this scope.',
    );
  });

  test('a rule beats a tool failure — findings are the more useful answer', () => {
    expect(
      report({
        findings: [finding('eqeqeq')],
        toolFailures: ['oxlint failed to run: boom'],
      }).top_risk,
    ).toBe(
      '`eqeqeq` reported 1 time(s) — the most frequent lint violation in this scope.',
    );
  });

  test('joins the tool failures when nothing was found and something broke', () => {
    expect(
      report({ toolFailures: ['first failed.', 'second failed.'] }).top_risk,
    ).toBe('first failed. second failed.');
  });

  test('falls back to the no-config message when there is one', () => {
    expect(report({ noConfigMessage: 'No oxlint config here.' }).top_risk).toBe(
      'No oxlint config here.',
    );
  });

  test('falls back to the default when there is not', () => {
    expect(report({}).top_risk).toBe('No lint findings.');
  });
});
