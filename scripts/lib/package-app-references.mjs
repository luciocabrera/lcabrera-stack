/**
 * The rule: a published package may not point at one of this repository's apps.
 * Apps are the harness; packages are consumed from outside this repo, where no
 * `apps/` directory exists — so a relative link into one is dead on arrival, and
 * prose about one describes a consumer the reader does not have.
 *
 * Existence is what discriminates a real reference from a worked example, but
 * only outside fenced code: `apps/web` in a config sample must keep passing on
 * the day this repo gains an `apps/web`, so fences are skipped rather than
 * resolved. Tests are skipped too — every package here excludes them from
 * `files`, so they reach no consumer.
 */

import { proseLines } from './renamed-mentions.mjs';

const APP_PATH = /\bapps\/[a-z0-9][a-z0-9_-]*/g;

const GENERATED = /(^|\/)CHANGELOG\.md$/;

const TEST = /\.test\.[a-z]+$/;

const SHIPPED_TEXT = /\.(css|js|md|mjs|ts|tsx|ya?ml)$/;
const NO_EXTENSION = /(^|\/)[^./]+$/;

export const isCheckedFile = (path) =>
  (SHIPPED_TEXT.test(path) || NO_EXTENSION.test(path)) &&
  !GENERATED.test(path) &&
  !TEST.test(path);

const numberedLines = (path, text) =>
  path.endsWith('.md')
    ? proseLines(text)
    : text
        .split('\n')
        .map((line, index) => ({ number: index + 1, text: line }));

export const appReferences = ({ exists, path, text }) =>
  numberedLines(path, text).flatMap((line) =>
    [...line.text.matchAll(APP_PATH)]
      .map((match) => ({ line: line.number, path, reference: match[0] }))
      .filter(({ reference }) => exists(reference)),
  );

export const formatFinding = ({ line, path, reference }) =>
  `${path}:${line} — a published package names \`${reference}\`, which exists ` +
  `in this repo. Packages are generic; state the property, not this consumer.`;
