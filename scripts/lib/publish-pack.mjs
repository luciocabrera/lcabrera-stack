/**
 * Produces the tarball a package would publish, and reads it back
 * (scripts/verify-publish-surface.mjs).
 *
 * The manifest on disk describes an intention, not an artifact. `exports`
 * points at `src` so nothing in this repo has to build, and the swap to `dist`
 * lives in `publishConfig.exports` — a **pnpm** extension that `npm pack`
 * ignores entirely. A gate reading `package.json` therefore checks a map that
 * may never reach a consumer; only the tarball says what ships. See
 * ADR-072 and ADR-057 for the hazard the swap exists to prevent.
 *
 * pnpm is spawned directly because `vp` does not wrap npm packing — its own
 * `vp pack` is a Vite library build, a different thing (AGENTS.md section 4).
 * Under `vp run` the toolchain's managed pnpm is on PATH, which is why the
 * gates are run that way.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { delimiter, join } from 'node:path';

import { createPackageFromTarballData } from '@arethetypeswrong/core';

/**
 * The pnpm executable as an absolute path.
 *
 * Resolved from PATH here rather than from a fixed system directory as
 * `git-exec.mjs` does: pnpm is not a system binary but the toolchain's own,
 * which `vp run` puts on PATH for the task. Naming the file outright still
 * removes the lookup from the spawn itself (Sonar S4036).
 */
const pnpmBinary = () =>
  (process.env.PATH ?? '')
    .split(delimiter)
    .filter((directory) => directory.length > 0)
    .map((directory) => join(directory, 'pnpm'))
    .find((candidate) => existsSync(candidate));

/**
 * Packs one package with pnpm; returns the tarball path.
 *
 * Throws when pnpm is missing rather than returning "nothing to check" — a
 * publishing gate that cannot produce the artifact has verified nothing, and
 * saying so is the whole point of this file.
 */
const packPackage = ({ destination, directory }) => {
  const binary = pnpmBinary();
  if (binary === undefined) {
    throw new Error(
      'pnpm is not on PATH, so no tarball could be produced. Run this gate through `vp run publish:verify`, which puts the toolchain’s pnpm there.',
    );
  }
  const stdout = execFileSync(
    binary,
    ['pack', '--json', '--pack-destination', destination],
    {
      cwd: directory,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const { filename } = JSON.parse(stdout);
  if (typeof filename !== 'string') {
    throw new TypeError(`pnpm pack reported no tarball for ${directory}.`);
  }
  return filename;
};

/**
 * The packed tarball as a consumer would find it under `node_modules`: the
 * published manifest, the file list relative to the package root, and a reader
 * for the contents. Backed by the same unpacker attw uses, so the gate does not
 * carry a tar implementation of its own.
 */
const readPackedPackage = (tarballPath) => {
  const packed = createPackageFromTarballData(
    new Uint8Array(readFileSync(tarballPath)),
  );
  const root = `/node_modules/${packed.packageName}/`;
  return {
    files: packed.listFiles().map((path) => path.slice(root.length)),
    manifest: JSON.parse(packed.readFile(`${root}package.json`)),
    name: packed.packageName,
    readFile: (relativePath) => packed.readFile(`${root}${relativePath}`),
  };
};

/** Packs a package and reads the result back, in one step. */
export const packAndRead = ({ destination, directory }) =>
  readPackedPackage(packPackage({ destination, directory }));
