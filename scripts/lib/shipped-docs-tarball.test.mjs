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

import { readPublishing } from '../../packages/repo-standards/scripts/config.mjs';
import { packAndRead } from '../../packages/repo-standards/scripts/publish-pack.mjs';
import {
  packageFindings,
  shippedDocuments,
} from '../../packages/repo-standards/scripts/shipped-docs.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { packagesDir } = readPublishing(REPO_ROOT);

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
