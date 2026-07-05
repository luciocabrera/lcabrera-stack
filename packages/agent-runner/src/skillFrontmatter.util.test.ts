import { describe, expect, it } from 'vitest';

import { loadSkillFrontmatter } from './skillFrontmatter.util.ts';

describe('loadSkillFrontmatter', () => {
  it('parses frontmatter and body from a real SKILL.md', () => {
    const result = loadSkillFrontmatter({
      skillPath: 'packages/agent-runner/src/__fixtures__/fixture-skill',
    });

    expect(result.frontmatter).toEqual({
      name: 'fixture-skill',
      description:
        'Test fixture only — not a real skill, used by skillFrontmatter.util.test.ts.',
      'allowed-tools': 'Bash(cat:*,git:*), Read, Grep',
    });
    expect(result.body).toContain('# Fixture Skill');
    expect(result.body).toContain(
      'Body content used to assert `loadSkillFrontmatter`',
    );
  });

  it('throws when the SKILL.md has no frontmatter fence', () => {
    expect(() =>
      loadSkillFrontmatter({
        skillPath:
          'packages/agent-runner/src/__fixtures__/fixture-skill-no-frontmatter',
      }),
    ).toThrow(/Could not parse frontmatter/);
  });
});
