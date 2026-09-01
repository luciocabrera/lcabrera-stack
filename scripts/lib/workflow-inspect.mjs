/**
 * Reads a workflow file the way its invariant tests need to read it.
 *
 * The review gates encode two things a linter cannot see: a job must never share
 * a name with the commit status it publishes, and the absence of a cancelling
 * concurrency group is deliberate. Both are asserted from the file's own text,
 * and the readers were copy-pasted between the first two test files before a
 * third arrived — which is exactly the drift `.claude/rules/scripts.md` means by
 * "shared logic imported, not copy-pasted".
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const readRepoFile = (path) =>
  readFileSync(join(REPO_ROOT, path), 'utf8');

export const declaredNames = (source) =>
  [...source.matchAll(/^[ \t]*name:[ \t]*(\S.*)$/gm)].map((match) =>
    match[1].trim(),
  );

export const commentProse = (source) =>
  source.replaceAll(/^[ \t]*#[ \t]?/gm, '').replaceAll(/\s+/gu, ' ');

const STEP_LINE = /^([ \t]*)-[ \t]+name:[ \t]*(\S.*)$/;

export const stepBlock = (source, name) => {
  const lines = source.split('\n');
  const start = lines.findIndex(
    (line) => STEP_LINE.exec(line)?.[2].trim() === name,
  );
  if (start === -1) {
    return undefined;
  }
  const indent = STEP_LINE.exec(lines[start])[1];
  const after = lines.slice(start + 1);
  const next = after.findIndex((line) => STEP_LINE.exec(line)?.[1] === indent);
  return [lines[start], ...(next === -1 ? after : after.slice(0, next))].join(
    '\n',
  );
};

const depthOf = (line) =>
  line.trim() === '' ? -1 : line.length - line.trimStart().length;

export const stepEnvValue = (step, key) => {
  const lines = (step ?? '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'));
  const start = lines.findIndex((line) => line.trim() === 'env:');
  if (start === -1) {
    return undefined;
  }
  const prefix = `${key}:`;
  for (const line of lines.slice(start + 1)) {
    if (depthOf(line) !== -1 && depthOf(line) <= depthOf(lines[start])) {
      return undefined;
    }
    if (line.trim().startsWith(prefix)) {
      return line.trim().slice(prefix.length).trim();
    }
  }
  return undefined;
};

export const singleQuotedConst = (source, name) => {
  const marker = `const ${name} = '`;
  const start = source.indexOf(marker);
  if (start === -1) {
    return undefined;
  }
  const rest = source.slice(start + marker.length);
  return rest.slice(0, rest.indexOf("'"));
};
