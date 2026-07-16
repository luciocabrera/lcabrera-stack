import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = dirname(fileURLToPath(import.meta.url));

/** This package lives inside the CQMS (vite-react-compiler) repo itself — skillPath (TECH_SPEC §2.6) is relative to here. */
export const cqmsRepoRoot = resolve(packageDirectory, '..', '..', '..');
