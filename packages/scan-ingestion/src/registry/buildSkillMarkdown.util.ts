type BuildSkillMarkdownArgs = {
  readonly allowedTools?: readonly string[];
  readonly description?: string;
  readonly displayName: string;
  readonly scannerId: string;
  readonly stepsMarkdown?: string;
};

const DEFAULT_ALLOWED_TOOLS = [
  'Bash(cat:*,date:*,git:*,mkdir:*,node:*,tee:*)',
  'Read',
  'Grep',
  'Glob',
] as const;

/**
 * SKILL.md scaffold for a registry-added LLM scanner (ADR-023) — the same
 * frontmatter shape as the hand-written skills (code-smell-checker et al.).
 * A scaffold, not a finished skill: the registry never overwrites an
 * existing file, so a developer refining it on disk stays authoritative.
 */
export const buildSkillMarkdown = ({
  allowedTools,
  description,
  displayName,
  scannerId,
  stepsMarkdown,
}: BuildSkillMarkdownArgs): string => {
  const resolvedDescription =
    description ?? `${displayName} scan registered via the CQMS registry.`;
  const resolvedTools =
    allowedTools && allowedTools.length > 0
      ? allowedTools
      : DEFAULT_ALLOWED_TOOLS;
  const resolvedSteps =
    stepsMarkdown ??
    'TODO: describe the scan steps (see code-smell-checker/SKILL.md for the expected report contract).';

  return `---
name: ${scannerId}
description: ${resolvedDescription}
argument-hint: 'Target area, for example: src/'
user-invocable: true
context: fork
agent: general-purpose
allowed-tools: ${resolvedTools.join(', ')}
---

# ${displayName}

## Outcome

${resolvedDescription}

Produce the canonical CQMS report artifacts (report.json + report.md) in the
run output directory, then ingest via packages/scan-ingestion/src/cli/ingest.cli.ts
with --skill=${scannerId}.

## Steps

${resolvedSteps}
`;
};
