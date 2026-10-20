/**
 * Running publint over each packed tarball (verify-devkit-tarball.mjs), at
 * error level, so a manifest convention publint knows — an export target that
 * does not exist, a misplaced types condition, a file the manifest names and
 * `files` leaves out — fails before a version is published (ADR-073).
 *
 * Every run also lints a planted tarball whose only export points at a missing
 * file. A publint that reports nothing there would report nothing on a real
 * fault either, so a clean result is only trusted while the plant is caught.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { publint } from 'publint';
import { formatMessage } from 'publint/utils';

import { run } from './devkit-pack.mjs';

const PLANT_NAME = 'publint-plant';

const asArrayBuffer = (bytes) =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

/**
 * @param {string} tarball
 * @returns {Promise<{ errors: string[], name: string }>}
 */
export const lintTarball = async (tarball) => {
  const { messages, pkg } = await publint({
    level: 'error',
    pack: { tarball: asArrayBuffer(readFileSync(tarball)) },
  });
  return {
    errors: messages
      .filter((message) => message.type === 'error')
      .map(
        (message) =>
          `${message.code}: ${formatMessage(message, pkg, { color: false }) ?? message.path.join('.')}`,
      ),
    name: pkg.name,
  };
};

/**
 * @param {{ exports: Record<string, string>, into: string, name: string }} args
 * @returns {string}
 */
export const writeTarball = ({ exports, into, name }) => {
  const root = join(into, name);
  mkdirSync(join(root, 'package'), { recursive: true });
  writeFileSync(
    join(root, 'package', 'package.json'),
    `${JSON.stringify({ exports, name, type: 'module', version: '0.0.0' }, undefined, 2)}\n`,
  );
  const tarball = join(into, `${name}.tgz`);
  run('tar', ['-czf', tarball, 'package'], root);
  return tarball;
};

export const publintLines = (results) =>
  results.map(
    ({ errors, name }) =>
      `publint ${name}: ${errors.length === 0 ? 'no errors' : `${errors.length} error(s)`}\n`,
  );

export const publintFindings = ({ planted, results }) => [
  ...results.flatMap(({ errors, name }) =>
    errors.map((error) => `${name}: publint ${error}`),
  ),
  ...(planted.errors.some((error) => error.startsWith('FILE_DOES_NOT_EXIST'))
    ? []
    : [
        'publint reported no FILE_DOES_NOT_EXIST on a planted export that points at a missing file, so its clean results prove nothing',
      ]),
];

/**
 * @param {{ into: string, tarballs: string[] }} args
 * @returns {Promise<{ findings: string[], lines: string[] }>}
 */
export const publintGate = async ({ into, tarballs }) => {
  const results = await Promise.all(tarballs.map(lintTarball));
  const planted = await lintTarball(
    writeTarball({
      exports: { '.': './missing.mjs' },
      into,
      name: PLANT_NAME,
    }),
  );
  return {
    findings: publintFindings({ planted, results }),
    lines: publintLines(results),
  };
};
