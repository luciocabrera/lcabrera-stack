/*
 * That this repository's internal documents really do stay out of the install —
 * asserted against the packed tarball, because nothing else can see it.
 *
 * The rule travels in `@lcabrera/repo-standards` (`shipped-docs.mjs` decides
 * whether a document reads with only its package on disk); which documents THIS
 * repository ships is its own fact and stays here, the same split
 * `publish-wiring.test.mjs` makes.
 *
 * What it defends is a manifest line, not a file. Every document below is still
 * in the working tree and still read by agents working in this repo — it is the
 * `!src/**\/*.md` negation in `files` that keeps it out of the artifact, and
 * that negation is invisible to every in-repo run: `workspace:*` resolves the
 * source directory and ignores `files` entirely. Delete the negation and this
 * is the only check in the repository whose answer changes.
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vite-plus/test';

import { readFileSync } from 'node:fs';

import { readPublishing } from '../../packages/repo-standards/scripts/config.mjs';
import { packAndRead } from '../../packages/repo-standards/scripts/publish-pack.mjs';
import {
  packageFindings,
  shippedDocuments,
} from '../../packages/repo-standards/scripts/shipped-docs.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { packagesDir, publicPackageDirs } = readPublishing(REPO_ROOT);

/** The packages that keep documentation inside `src/` and must not ship it. */
const SOURCE_DOC_PACKAGES = ['server', 'ui', 'utils'];

const workDirectory = mkdtempSync(join(tmpdir(), 'shipped-docs-test-'));
afterAll(() => rmSync(workDirectory, { force: true, recursive: true }));

const walk = (dir, prefix = '') =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.name === 'node_modules') return [];
    return entry.isDirectory() ? walk(join(dir, entry.name), path) : [path];
  });

describe.each(SOURCE_DOC_PACKAGES)('packages/%s', (directory) => {
  const source = join(REPO_ROOT, packagesDir, directory);
  const inTree = existsSync(join(source, 'src'))
    ? walk(join(source, 'src'), 'src').filter((path) => path.endsWith('.md'))
    : [];
  const packed = packAndRead({ destination: workDirectory, directory: source });

  it('still keeps the documents in the working tree', () => {
    // The half that makes the next assertion evidence rather than a tautology:
    // "the tarball holds no src markdown" is equally true of a package that
    // deleted its documentation, and that is not what happened here.
    expect(inTree.length).toBeGreaterThan(0);
  });

  it('ships none of them to a consumer', () => {
    expect(packed.files.filter((path) => path.endsWith('.md'))).not.toEqual(
      expect.arrayContaining(inTree),
    );
    expect(
      shippedDocuments(packed.files).filter((path) => path.startsWith('src/')),
    ).toEqual([]);
  });

  it('still ships the source those documents describe', () => {
    // The negation has to remove the documents and nothing else. `!src/**` with
    // a typo'd extension takes the package's whole reason for existing with it,
    // and every other gate here would keep passing.
    expect(
      packed.files.filter((path) => path.startsWith('src/')).length,
    ).toBeGreaterThan(0);
  });
});

/**
 * The property the three blocks above rest on, isolated: two packs of ONE
 * unchanged directory, differing only in a `files` line.
 *
 * A gate reading the working tree, or reading `files` and resolving it itself,
 * would give the same answer both times — so this is the probe that
 * discriminates between "reads the artifact" and "reads the intention", which
 * the real packages cannot, since their manifests are fixed.
 */
describe('the corpus follows the manifest, not the tree', () => {
  const fixture = join(workDirectory, 'fixture');
  mkdirSync(join(fixture, 'docs'), { recursive: true });
  writeFileSync(join(fixture, 'README.md'), '# thing\n\nA package.\n');
  writeFileSync(
    join(fixture, 'docs', 'internal.md'),
    '# Internal\n\nADR-038.\n',
  );

  const corpusWith = (files) => {
    writeFileSync(
      join(fixture, 'package.json'),
      JSON.stringify({ files, name: 'thing', version: '1.0.0' }),
    );
    const packed = packAndRead({
      destination: join(workDirectory, 'packs'),
      directory: fixture,
    });
    return {
      documents: shippedDocuments(packed.files),
      findings: packageFindings({
        files: packed.files,
        name: packed.name,
        readFile: packed.readFile,
        repoOnlyDirs: ['docs'],
      }).findings,
    };
  };

  it('reads a document the manifest ships, and reports it', () => {
    const shipping = corpusWith(['docs']);
    expect(shipping.documents).toContain('docs/internal.md');
    expect(shipping.findings).toEqual([
      expect.stringContaining('docs/internal.md:3 cites ADR-038'),
    ]);
  });

  it('stops reading it when only the manifest changes', () => {
    // Same file, same contents, still on disk — `ls` would show it either way.
    expect(existsSync(join(fixture, 'docs', 'internal.md'))).toBe(true);

    const excluded = corpusWith(['docs', '!docs/**/*.md']);
    expect(excluded.documents).toEqual(['README.md']);
    expect(excluded.findings).toEqual([]);
  });
});

/**
 * That the negation is on EVERY published manifest, not only the three that
 * had documents to remove.
 *
 * This is the assertion `packages/CLAUDE.md` was making in prose and nothing
 * was checking. The bullet states one `files` shape for every public package;
 * for a while five of them did not have it, so the file agents load on every
 * `packages/` edit asserted a guard most manifests did not carry — and the
 * failure that sets up is the one this whole gate exists to close. Someone adds
 * `packages/api/src/ARCHITECTURE.md`, reads the bullet, and the document ships.
 *
 * The content gate catches that only if the new document happens to carry a bad
 * link or a bare citation. Likely, not certain. The manifest line is what makes
 * it certain, so it is the one asserted here — and asserted from the roster
 * rather than a written-out list, so a package is covered the day it is
 * published rather than the day someone remembers this file.
 */
describe('every published manifest keeps its own source markdown out', () => {
  const manifestOf = (directory) =>
    JSON.parse(
      readFileSync(
        join(REPO_ROOT, packagesDir, directory, 'package.json'),
        'utf8',
      ),
    );

  it('has a roster to check, so this cannot pass over nothing', () => {
    expect(publicPackageDirs.length).toBeGreaterThan(0);
  });

  it.each(publicPackageDirs)('packages/%s', (directory) => {
    const files = manifestOf(directory).files ?? [];
    // Whichever directory this package actually publishes its source from —
    // the `.mjs` packages keep theirs under `scripts`, and `@lcabrera/devkit`'s
    // `assets` are deliberately NOT it: that markdown is what the package
    // exists to copy, so negating it would gut the product.
    const sourceDir = ['src', 'scripts'].find((name) => files.includes(name));
    expect(
      sourceDir,
      `packages/${directory} publishes no source directory`,
    ).toBeDefined();
    expect(files).toContain(`!${sourceDir}/**/*.md`);
  });
});
