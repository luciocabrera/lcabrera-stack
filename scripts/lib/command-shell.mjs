/**
 * The two effects every adjudication command's shell shares: writing a JSON
 * record inside the repository, and running the command so a thrown error
 * becomes one prefixed line on stderr and exit code 1.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import process from 'node:process';

import { repoPath } from './tool-paths.mjs';

export const jsonWriterIn = (root) => (path, value) => {
  const target = repoPath({ path, root });
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
};

export const runCommand = ({ name, run }) => {
  try {
    process.exitCode = run();
  } catch (error) {
    process.stderr.write(
      `${name}: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
};
