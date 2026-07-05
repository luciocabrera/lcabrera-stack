import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = dirname(fileURLToPath(import.meta.url));

/** This app lives inside the CQMS (vite-react-compiler) repo itself — the linter-checker skill script (TECH_SPEC §2.5/§2.7) is invoked relative to here. */
export const cqmsRepoRoot = resolve(packageDirectory, '..', '..', '..');
