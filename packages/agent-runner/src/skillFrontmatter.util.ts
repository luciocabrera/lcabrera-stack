import { join } from 'node:path';

// Relative, not a package alias — scripts/validate-skills.cjs is a
// repo-root tooling script, not a workspace package. Reuses its
// parseFrontmatter export (TECH_SPEC §2.6: "reusing the logic already in
// scripts/validate-skills.cjs, not reimplementing it") rather than
// duplicating the ~20-line frontmatter parser.
// @ts-expect-error -- plain CJS script, no type declarations
import { parseFrontmatter } from '../../../scripts/validate-skills.cjs';

import { cqmsRepoRoot } from './cqmsRepoRoot.util.ts';

export type SkillFrontmatter = {
  readonly body: string;
  readonly frontmatter: Record<string, string>;
};

type LoadSkillFrontmatterArgs = {
  /** '.github/skills/<dir>' — relative to the CQMS repo root. */
  readonly skillPath: string;
};

export const loadSkillFrontmatter = ({
  skillPath,
}: LoadSkillFrontmatterArgs): SkillFrontmatter => {
  const skillMdPath = join(cqmsRepoRoot, skillPath, 'SKILL.md');
  const parsed: SkillFrontmatter | null = parseFrontmatter(skillMdPath);

  if (!parsed) {
    throw new Error(`Could not parse frontmatter from ${skillMdPath}`);
  }

  return parsed;
};
