/**
 * Extracts the `packages:` glob list from pnpm-workspace.yaml text with a
 * deliberate line parser — no YAML dependency (ADR-021). The file's
 * relevant shape is a flat block sequence:
 *
 *   packages:
 *     - apps/*
 *     - 'packages/*'
 *     - '!apps/legacy'
 *
 * Collection stops at the next top-level key (catalog:, allowBuilds:, …).
 * Anything fancier (anchors, flow sequences) degrades to an empty list —
 * discovery is best-effort by contract.
 */
export const parsePnpmWorkspaceGlobs = (
  yamlText: string,
): readonly string[] => {
  const lines = yamlText.split('\n');
  const globs: string[] = [];
  let isInPackagesBlock = false;

  for (const line of lines) {
    const withoutComment = line.split('#', 1)[0] ?? '';
    if (withoutComment.trim().length === 0) {
      continue;
    }

    const isTopLevelKey = /^[A-Za-z]/.test(withoutComment);
    if (isTopLevelKey) {
      isInPackagesBlock = /^packages:\s*$/.test(withoutComment.trim());
      continue;
    }

    if (!isInPackagesBlock) {
      continue;
    }

    const itemMatch = /^\s+-\s+(.+)$/.exec(withoutComment);
    const item = itemMatch?.[1]?.trim().replaceAll(/^['"]|['"]$/g, '');
    if (item) {
      globs.push(item);
    }
  }

  return globs;
};
