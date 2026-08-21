// Where this tooling considers "here" to be: the repository it is INSTALLED
// in, never the project being scanned. Four things hang off it — the `.tmp`
// scratch root, a bare positional scope, the `node_modules` the fallow and
// ts-morph binaries are resolved from, and the ingestion config file.
//
// The resolution itself lives in `@lcabrera/repo-standards/host-root`: every
// installed tooling package needs the same answer, and two copies of it is what
// fallow reported when the second one was written. Only the environment
// variable that overrides it is this package's own.

import { resolveHostRoot as resolveWithin } from '@lcabrera/repo-standards/host-root';

export {
  findRepositoryRoot,
  rootFromInstallPath,
} from '@lcabrera/repo-standards/host-root';

export const HOST_ROOT_ENV = 'SCAN_REPORT_HOST_ROOT';

export const resolveHostRoot = ({ env = process.env, moduleDirectory }) =>
  resolveWithin({ env, envName: HOST_ROOT_ENV, moduleDirectory });
