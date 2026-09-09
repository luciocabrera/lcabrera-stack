/**
 * Emits non-blocking warnings as GitHub Actions `::warning::` annotations under
 * CI, or as plain indented lines locally. Shared by the verify scripts so the
 * annotation format lives in one place. See `.claude/rules/scripts.md`.
 */
export const reportWarnings = (warnings) => {
  const isUnderActions = process.env.GITHUB_ACTIONS === 'true';
  for (const warning of warnings) {
    console.error(isUnderActions ? `::warning::${warning}` : `  ⚠ ${warning}`);
  }
};
