/*
 * The values `./config` publishes that a guard or a default reads. A consumer
 * holds the same objects this package does, so a mutation through the export
 * would change what a run trusts; each one is frozen, and a mutation throws.
 *
 * Usage: `vp run test` in this workspace; exits non-zero on a failing case.
 */

import { describe, expect, test } from 'vite-plus/test';

import {
  DEFAULT_CONFIG,
  KIT_GROUPS,
  PROFILE_LADDER,
  PROFILES,
} from './config.mjs';
import { retirementRefusal } from './retirement.mjs';

const MUTATIONS = {
  'DEFAULT_CONFIG.ci.setup': () => {
    DEFAULT_CONFIG.ci.setup.push('- run: x');
  },
  'DEFAULT_CONFIG.paths': () => {
    DEFAULT_CONFIG.paths.skills = 'elsewhere';
  },
  'DEFAULT_CONFIG.profile': () => {
    DEFAULT_CONFIG.profile = 'full';
  },
  KIT_GROUPS: () => KIT_GROUPS.splice(1),
  PROFILE_LADDER: () => {
    PROFILE_LADDER.push('beyond');
  },
  PROFILES: () => {
    PROFILES.beyond = ['skills'];
  },
  'PROFILES.agent': () => {
    PROFILES.agent.push('workspace');
  },
};

describe('an exported value a guard or a default trusts', () => {
  for (const [name, mutate] of Object.entries(MUTATIONS)) {
    test(`${name} refuses a mutation`, () => {
      expect(mutate).toThrow(TypeError);
    });
  }

  test('a mutation of KIT_GROUPS cannot weaken the asset-set refusal', () => {
    const [first] = KIT_GROUPS;
    const onlyFirst = [{ content: '', path: `${first}/kept.md` }];
    try {
      KIT_GROUPS.splice(1);
    } catch {
      expect(Object.isFrozen(KIT_GROUPS)).toBe(true);
    }

    expect(retirementRefusal({ assets: onlyFirst })).toContain(
      'Retired nothing',
    );
  });
});
