import { describe, expect, it } from 'vitest';

import { buildSkillMarkdown } from './buildSkillMarkdown.util.ts';

describe('buildSkillMarkdown', () => {
  it('renders the hand-written skills frontmatter shape with provided fields', () => {
    const markdown = buildSkillMarkdown({
      allowedTools: ['Read', 'Grep'],
      description: 'Finds dependency cycles.',
      displayName: 'Cycle Finder',
      scannerId: 'cycle-finder',
      stepsMarkdown: '1. Run the analysis.',
    });

    expect(markdown.startsWith('---\nname: cycle-finder\n')).toBe(true);
    expect(markdown).toContain('description: Finds dependency cycles.');
    expect(markdown).toContain('allowed-tools: Read, Grep');
    expect(markdown).toContain('# Cycle Finder');
    expect(markdown).toContain('1. Run the analysis.');
    expect(markdown).toContain('--skill=cycle-finder');
  });

  it('falls back to defaults for the optional fields', () => {
    const markdown = buildSkillMarkdown({
      displayName: 'Bare Scanner',
      scannerId: 'bare-scanner',
    });

    expect(markdown).toContain(
      'description: Bare Scanner scan registered via the CQMS registry.',
    );
    expect(markdown).toContain('allowed-tools: Bash(');
    expect(markdown).toContain('TODO: describe the scan steps');
  });
});
