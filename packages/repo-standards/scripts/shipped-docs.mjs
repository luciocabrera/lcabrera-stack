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
 */

import { posix } from 'node:path';

import { inlineCodeTokens, normaliseToken } from './docs-paths.mjs';
import { isIgnoredDoc } from './markdown-corpus.mjs';

/** A markdown link's target — the one shape that is a pointer by construction. */
const LINK = /\]\(([^)\s]{1,512})\)/g;

/** A fence opens or closes on its own line; three or more of either marker. */
const FENCE = /^ {0,3}(?:`{3,}|~{3,})/;

/**
 * A scheme of at least two characters, which is what separates `mailto:` from a
 * Windows drive letter, plus the protocol-relative form. Anything with one is
 * the reader's browser's problem rather than this gate's.
 */
const isExternal = (target) =>
  /^[a-z][a-z\d+.-]+:/i.test(target) || target.startsWith('//');

/**
 * Shapes that are never a path a reader could follow: globs, placeholders,
 * commands, anchors, machine-absolute paths, URLs. Same trade as the
 * documented-path gate — recall for precision, because a gate that cries wolf
 * over a teaching placeholder gets bypassed.
 */
const isUnresolvable = (token) =>
  token === '' ||
  /\s/.test(token) ||
  /[*?{}[\]<>\\|]/.test(token) ||
  token.startsWith('/') ||
  token.startsWith('#') ||
  isExternal(token);

/**
 * Lines outside every fenced block, each keeping its 1-based number.
 *
 * Fences are examples: the paths and commands inside one are illustrative far
 * more often than not, and reporting them is how a doc gate earns a reputation
 * for noise. The number is carried because a citation finding is about a line,
 * and a reader given only a filename has to re-find it.
 */
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

/** Every markdown link target in the prose, with the line that carried it. */
const linkTargets = (lines) =>
  lines.flatMap(({ number, text }) =>
    [...text.matchAll(LINK)].map((match) => ({
      number,
      target: normaliseToken(match[1]),
    })),
  );

/**
 * Where a relative target lands inside the package, as the packed file list
 * spells paths: package-root-relative, no leading `./`, no trailing slash.
 */
const resolveTarget = ({ docPath, target }) => {
  const base = posix.dirname(docPath);
  const resolved = posix.normalize(base === '.' ? target : `${base}/${target}`);
  const trimmed = resolved.endsWith('/') ? resolved.slice(0, -1) : resolved;
  return trimmed === '' ? '.' : trimmed;
};

/** `..` climbs only as a whole segment — `..data` is a name, not a parent. */
const escapesPackage = (path) => path === '..' || path.startsWith('../');

/**
 * Findings for the links in one document: the ones that leave the package, and
 * the ones that stay inside it and name something the tarball does not hold.
 *
 * The second is not a lesser version of the first. It is the failure a `files`
 * negation introduces — the target is right there in the working tree, so
 * nothing in the source repository can see that the install has lost it.
 */
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

/**
 * A token anchored at a directory the roster names, and NOT shipped by the
 * package that named it.
 *
 * Both halves are load-bearing, and the second one is the half that keeps this
 * rule honest. The roster is the author repository's layout, so it is the
 * precision mechanism that separates `docs/decisions/` from `try/catch` — but a
 * roster entry can also be a directory the package genuinely ships:
 * `@lcabrera/repo-standards` and `@lcabrera/devkit` both put `scripts/` in
 * `files`, so a README of theirs naming `scripts/verify-pr.mjs` is naming a
 * file that arrives in the install. Judging by the first path segment alone
 * reported that as unreachable, and the only way to satisfy such a finding is
 * to delete accurate documentation — which is precisely the noise reputation
 * this module's header says the gate must not earn.
 *
 * So `holds` decides it, from the packed file list: a path the tarball carries
 * is by construction not a path only the author has.
 */
const repoAnchored = ({ holds, repoOnlyDirs, token }) =>
  !isUnresolvable(token) &&
  token.includes('/') &&
  repoOnlyDirs.includes(token.split('/')[0]) &&
  !holds(token.endsWith('/') ? token.slice(0, -1) : token);

/**
 * Backticked tokens and link targets naming the author's own tree.
 *
 * Reported once per token: a document that names one directory in fifteen
 * places has one thing to fix, and fifteen lines saying so buries the other
 * fourteen findings.
 *
 * A path in BARE PROSE is deliberately not a candidate — only inline code and
 * link targets are. That is the documented-path gate's trade, taken here for
 * the same reason: resolving every `word/word` in a sentence is what produced
 * its ~830 hits, most of them conventions rather than paths, and a gate that
 * cries wolf gets bypassed. The cost is real and bounded — a shipped document
 * can name `docs/decisions` in running text and go unreported — and it is worth
 * paying only while the corpus does not do it. Widening this is safe; check the
 * shipped corpus first, because a rule that reports a teaching placeholder
 * costs more than the one instance it catches.
 */
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

/** `ADR-073`, in any of the spellings a sentence puts it in. */
const CITATION = /\bADR-\d+/;

/**
 * The one form of citation that travels. A reader inside `node_modules` cannot
 * resolve a decision by number, by filename, or by a repo-relative link — only
 * by a URL they can open, so the line carrying the citation has to carry one.
 *
 * Judged per LINE rather than per document: a page that links one decision
 * properly and names six others in passing has six references its reader cannot
 * follow, and a document-level check would call it clean.
 */
const ABSOLUTE_URL = /https?:\/\//;

const citationFindings = ({ docPath, lines }) =>
  lines
    .filter(({ text }) => CITATION.test(text) && !ABSOLUTE_URL.test(text))
    .map(
      ({ number, text }) =>
        `${docPath}:${number} cites ${CITATION.exec(text)?.[0]} with no absolute URL on the line — a reader with only the install cannot resolve it`,
    );

/** Every finding for one shipped document. */
export const documentFindings = ({ docPath, holds, repoOnlyDirs, text }) => {
  const lines = proseLines(text);
  return [
    ...linkFindings({ docPath, holds, lines }),
    ...repoPathFindings({ docPath, holds, lines, repoOnlyDirs }),
    ...citationFindings({ docPath, lines }),
  ];
};

/**
 * The documents in a tarball this gate is accountable for.
 *
 * The exemptions are the corpus module's, not a second list: a changelog names
 * paths as they were and a template's paths are placeholders to be replaced, so
 * both are dated or illustrative records rather than instructions. Two walkers
 * with two notions of "ignored" drift, and the symptom is a gate quietly
 * reading fewer documents.
 */
export const shippedDocuments = (files) =>
  files
    .filter(
      (path) =>
        path.endsWith('.md') &&
        !isIgnoredDoc({ docPath: path, ignoredDocs: [] }),
    )
    .toSorted((left, right) => left.localeCompare(right));

/**
 * One package's verdict: how many documents a consumer receives, and what is
 * wrong with them.
 *
 * The document list is returned rather than inferred from the findings because
 * zero findings and zero documents are the same clean report otherwise — and a
 * manifest that stops shipping every document is exactly the change this gate
 * has to stay honest about.
 */
export const packageFindings = ({ files, name, readFile, repoOnlyDirs }) => {
  const documents = shippedDocuments(files);
  const shipped = new Set(files);
  const holds = (path) =>
    path === '.' ||
    shipped.has(path) ||
    files.some((entry) => entry.startsWith(`${path}/`));

  return {
    documents,
    // Carried through so the caller can refuse an empty corpus BY PACKAGE
    // without re-deriving which package a result came from.
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

/**
 * Why an empty roster is refused rather than passed.
 *
 * The same shape every other gate reading `publicPackageDirs` takes: a
 * publishing gate that reports success having packed nothing is worse than no
 * gate, because it is believed. It is checked before anything is read, so a
 * repository that has not declared its packages gets the sentence naming the
 * key rather than an ENOENT for a directory it never had.
 */
export const rosterProblem = (publicPackageDirs) =>
  publicPackageDirs.length === 0
    ? 'no package directory is declared in `publishing.publicPackageDirs`, so this gate would pack nothing and report a clean pass over no document at all'
    : undefined;

/**
 * Every package that reached a consumer with nothing readable in it.
 *
 * Asked per package, not over the roster, and the difference is the whole
 * check. `@lcabrera/ui`'s entire shipped corpus is its root README — the
 * `!src/**\/*.md` negation removes the rest and the changelog is an exempt
 * dated record — so losing that one file leaves it installing no readable
 * document at all. Summed across ten packages that regression moves the total
 * from 32 to 31 and prints a pass; and the total can only reach zero if every
 * package loses its README at once, which npm's always-include-the-README
 * behaviour puts out of reach. An aggregate refusal therefore guards a state it
 * cannot observe while the reachable one goes silently by.
 *
 * A package with no document is refused rather than skipped for the reason the
 * whole gate exists: "every shipped document reads correctly" is trivially true
 * of a package with no documents, and reads afterwards exactly like one that was
 * checked.
 */
export const emptyCorpusProblems = (packages) =>
  packages
    .filter(({ documents }) => documents.length === 0)
    .map(
      ({ name }) =>
        `${name} ships no document a consumer could read, so nothing about what it installs was checked — a package whose corpus is empty passes every rule here for free`,
    );
