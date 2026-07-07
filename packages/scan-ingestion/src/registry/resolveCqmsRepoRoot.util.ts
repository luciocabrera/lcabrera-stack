import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

/**
 * The CQMS (vite-react-compiler) repo root — registry artifact generation
 * (ADR-023) writes SKILL.md / runner-script scaffolds into this repo's own
 * `.github/skills/`, never into a scanned target. Resolved relative to this
 * module (packages/scan-ingestion/src/registry → four levels up), the same
 * technique as scan-orchestrator's cqmsRepoRoot.util.ts.
 */
export const resolveCqmsRepoRoot = (): string =>
  path.resolve(moduleDirectory, '..', '..', '..', '..');
