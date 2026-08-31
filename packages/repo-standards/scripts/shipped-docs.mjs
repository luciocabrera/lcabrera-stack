/*
 * Deciding whether a document a consumer INSTALLS reads correctly with only
 * that package on disk.
 *
 * The existing documented-path gate asks whether a path resolves in the
 * repository that wrote the document. For a published artifact that is the
 * inverted question: a link can resolve perfectly in the source tree and point
 * at nothing in the install, and a citation can be followable by everyone who
 * has the repository cloned and by nobody who does not. Registry pages and the
 * documents that arrive under `node_modules` are read by people deciding
 * whether to adopt a package and by agents acting on what they say, neither of
 * whom can open a directory that never shipped.
 *
 * Four failures, because they fail differently for that reader: a link that
 * climbs out of the package resolves to nothing; a link that stays inside it
 * but names a file `files` excluded is a dead link the source tree cannot show;
 * a path anchored at one of the author's own directories is an instruction to
 * open something the reader does not have; and a bare decision citation is a
 * reference with no way to follow it at all.
 *
 * Pure: callers hand in the packed file list and a reader for its contents, so
 * the packing, printing and exit code live in the CLI.
 *
 * A token anchored at a roster directory is judged against that packed list, not
 * by its first path segment. A roster entry can be a directory the package
 * genuinely ships — `@lcabrera/repo-standards` and `@lcabrera/devkit` both put
 * `scripts/` in `files` — so segment-only judgement reported an accurate README
 * as unreachable, and the only way to satisfy such a finding is to delete true
 * documentation. A path the tarball carries is by construction not a path only
 * the author has.
 */

import { posix } from 'node:path';

import { inlineCodeTokens, normaliseToken } from './docs-paths.mjs';
import { isIgnoredDoc } from './markdown-corpus.mjs';

const LINK = /\]\(([^)\s]{1,512})\)/g;

const FENCE = /^ {0,3}(?:`{3,}|~{3,})/;

const isExternal = (target) =>
  /^[a-z][a-z\d+.-]+:/i.test(target) || target.startsWith('//');

const isUnresolvable = (token) =>
  token === '' ||
  /\s/.test(token) ||
  /[*?{}[\]<>\\|]/.test(token) ||
  token.startsWith('/') ||
  token.startsWith('#') ||
  isExternal(token);

export const proseLines = (text) => {
  const lines = [];
  let fenced = false;
  let number = 0;
  for (const line of text.split('\n')) {
    number += 1;
    if (FENCE.test(line)) {
      fenced = !fenced;
    } else if (!fenced) {
      lines.push({ number, text: line });
    }
  }
  return lines;
};

const linkTargets = (lines) =>
  lines.flatMap(({ number, text }) =>
    [...text.matchAll(LINK)].map((match) => ({
      number,
      target: normaliseToken(match[1]),
    })),
  );

const resolveTarget = ({ docPath, target }) => {
  const base = posix.dirname(docPath);
  const resolved = posix.normalize(base === '.' ? target : `${base}/${target}`);
  const trimmed = resolved.endsWith('/') ? resolved.slice(0, -1) : resolved;
  return trimmed === '' ? '.' : trimmed;
};

const escapesPackage = (path) => path === '..' || path.startsWith('../');

const linkFindings = ({ docPath, holds, lines }) =>
  linkTargets(lines)
    .filter(({ target }) => !isUnresolvable(target))
    .flatMap(({ number, target }) => {
      const resolved = resolveTarget({ docPath, target });
      if (escapesPackage(resolved)) {
        return [
          `${docPath}:${number} links to \`${target}\`, which is outside the package — a reader with only the install has nothing there`,
        ];
      }
      return holds(resolved)
        ? []
        : [
            `${docPath}:${number} links to \`${target}\`, which the package does not ship — the link resolves in the source tree and nowhere else`,
          ];
    });

const repoAnchored = ({ holds, repoOnlyDirs, token }) =>
  !isUnresolvable(token) &&
  token.includes('/') &&
  repoOnlyDirs.includes(token.split('/')[0]) &&
  !holds(token.endsWith('/') ? token.slice(0, -1) : token);

const repoPathFindings = ({ docPath, holds, lines, repoOnlyDirs }) => {
  const candidates = lines.flatMap(({ number, text }) =>
    [
      ...inlineCodeTokens(text),
      ...[...text.matchAll(LINK)].map((m) => m[1]),
    ].map((raw) => ({ number, token: normaliseToken(raw) })),
  );

  const seen = new Set();
  const findings = [];
  for (const { number, token } of candidates) {
    if (seen.has(token) || !repoAnchored({ holds, repoOnlyDirs, token })) {
      continue;
    }
    seen.add(token);
    findings.push(
      `${docPath}:${number} names \`${token}\`, a path only the repository this was written in has`,
    );
  }
  return findings;
};

const CITATION = /\bADR-\d+/;

const ABSOLUTE_URL = /https?:\/\//;

const citationFindings = ({ docPath, lines }) =>
  lines
    .filter(({ text }) => CITATION.test(text) && !ABSOLUTE_URL.test(text))
    .map(
      ({ number, text }) =>
        `${docPath}:${number} cites ${CITATION.exec(text)?.[0]} with no absolute URL on the line — a reader with only the install cannot resolve it`,
    );

export const documentFindings = ({ docPath, holds, repoOnlyDirs, text }) => {
  const lines = proseLines(text);
  return [
    ...linkFindings({ docPath, holds, lines }),
    ...repoPathFindings({ docPath, holds, lines, repoOnlyDirs }),
    ...citationFindings({ docPath, lines }),
  ];
};

export const shippedDocuments = (files) =>
  files
    .filter(
      (path) =>
        path.endsWith('.md') &&
        !isIgnoredDoc({ docPath: path, ignoredDocs: [] }),
    )
    .toSorted((left, right) => left.localeCompare(right));

export const packageFindings = ({ files, name, readFile, repoOnlyDirs }) => {
  const documents = shippedDocuments(files);
  const shipped = new Set(files);
  const holds = (path) =>
    path === '.' ||
    shipped.has(path) ||
    files.some((entry) => entry.startsWith(`${path}/`));

  return {
    documents,
    name,
    findings: documents.flatMap((docPath) =>
      documentFindings({
        docPath,
        holds,
        repoOnlyDirs,
        text: readFile(docPath),
      }).map((detail) => `${name}: ${detail}`),
    ),
  };
};

export const rosterProblem = (publicPackageDirs) =>
  publicPackageDirs.length === 0
    ? 'no package directory is declared in `publishing.publicPackageDirs`, so this gate would pack nothing and report a clean pass over no document at all'
    : undefined;

export const emptyCorpusProblems = (packages) =>
  packages
    .filter(({ documents }) => documents.length === 0)
    .map(
      ({ name }) =>
        `${name} ships no document a consumer could read, so nothing about what it installs was checked — a package whose corpus is empty passes every rule here for free`,
    );
