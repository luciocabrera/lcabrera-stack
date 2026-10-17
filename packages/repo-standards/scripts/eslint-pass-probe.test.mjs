import { describe, expect, it } from 'vite-plus/test';

import {
  classifyFanOut,
  classifyProbe,
  PROBE_RULE,
} from './eslint-pass-probe.mjs';

const PROBE = 'tools/.eslint-probe-abc/probe.ts';

const fanOut = (...blocks) =>
  [
    '~/packages/one$ eslint . --config eslint.config.mjs --max-warnings 0',
    '',
    ...blocks,
    '~$ eslint tools --config eslint.config.mjs --max-warnings 0',
    '',
  ].join('\n');

const finding = (file, rule) =>
  [
    `/repo/${file}`,
    `  2:1  error  Expected "node:path" to come before "node:process"  ${rule}`,
    '',
    '✖ 1 problem (1 error, 0 warnings)',
    '',
  ].join('\n');

const classify = (output, status = 1) =>
  classifyFanOut({ output, probePath: PROBE, status });

describe('classifyFanOut', () => {
  it('reports when the rule is printed under the planted file', () => {
    expect(classify(fanOut(finding(PROBE, PROBE_RULE)))).toBe('reported');
  });

  it('reads a path printed with backslashes', () => {
    expect(classify(finding(PROBE, PROBE_RULE).replaceAll('/', '\\'))).toBe(
      'reported',
    );
  });

  it('is unreported when a passing fan-out never names the planted file', () => {
    expect(classify(fanOut(), 0)).toBe('unreported');
  });

  it('is blocked when a failing fan-out never names the planted file', () => {
    expect(classify(fanOut(finding('packages/one/src/a.ts', PROBE_RULE)))).toBe(
      'blocked',
    );
  });

  it('does not count the rule printed only under another file', () => {
    expect(
      classify(
        fanOut(
          finding('packages/one/src/a.ts', PROBE_RULE),
          finding(PROBE, 'unicorn/no-null'),
        ),
      ),
    ).toBe('blocked');
  });

  it('does not take a longer path that ends in the same name for the probe', () => {
    expect(classify(finding(`x${PROBE}`, PROBE_RULE), 0)).toBe('unreported');
  });
});

describe('classifyProbe', () => {
  it('tells a report, a silent pass and a crash apart', () => {
    expect(
      classifyProbe(JSON.stringify([{ messages: [{ ruleId: PROBE_RULE }] }])),
    ).toBe('reported');
    expect(classifyProbe(JSON.stringify([{ messages: [] }]))).toBe('silent');
    expect(classifyProbe('TypeError: boom')).toBe('crashed');
  });
});
