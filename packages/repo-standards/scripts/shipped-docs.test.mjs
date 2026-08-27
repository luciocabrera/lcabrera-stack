/*
 * Each rule shown failing on a planted violation and passing on its correction.
 *
 * That pairing is the point rather than the coverage: a rule that is not
 * reached reports exactly the same clean result as a document with nothing
 * wrong in it, so an assertion that something passes proves nothing on its own.
 * Every `it` below therefore fixes one thing about the document and nothing
 * else, so the finding it loses names the rule that produced it.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  corpusProblem,
  documentFindings,
  packageFindings,
  proseLines,
  rosterProblem,
  shippedDocuments,
} from './shipped-docs.mjs';

const REPO_ONLY = ['apps', 'docs', 'packages', 'scripts'];

/**
 * One document, read against a package that ships exactly what is listed.
 *
 * `holds` mirrors the CLI's: a directory counts when the package puts a file
 * into it, because `[source](./src/)` is the ordinary way to point at one.
 */
const findingsFor = ({ docPath = 'README.md', files = [], text }) => {
  const shipped = [...files, docPath];
  return documentFindings({
    docPath,
    holds: (path) =>
      path === '.' ||
      shipped.includes(path) ||
      shipped.some((entry) => entry.startsWith(`${path}/`)),
    repoOnlyDirs: REPO_ONLY,
    text,
  });
};

describe('a relative link that escapes the package', () => {
  it('is reported, naming the target the reader has nothing for', () => {
    const findings = findingsFor({
      docPath: 'src/Table/ARCHITECTURE.md',
      text: 'Grouping is [ADR-058](../../../docs/decisions/ADR-058-x.md).',
    });
    expect(findings).toContainEqual(
      expect.stringContaining('which is outside the package'),
    );
  });

  it('passes once the same citation carries an absolute URL', () => {
    expect(
      findingsFor({
        docPath: 'src/Table/ARCHITECTURE.md',
        text: 'Grouping is [ADR-058](https://example.test/ADR-058-x.md).',
      }),
    ).toEqual([]);
  });
});

describe('a relative link the package does not ship', () => {
  // The failure a `files` negation introduces. The target is still in the
  // working tree, so nothing in the source repository can observe it — which is
  // why the gate reads the tarball and this test hands it a file list.
  const text = 'The patterns are in [PATTERNS.md](./PATTERNS.md).';

  it('is reported when the file is not in the packed list', () => {
    expect(findingsFor({ text })).toEqual([
      expect.stringContaining('which the package does not ship'),
    ]);
  });

  it('passes when the same manifest ships it', () => {
    expect(findingsFor({ files: ['PATTERNS.md'], text })).toEqual([]);
  });

  it('accepts a link to a directory the package puts a file into', () => {
    expect(
      findingsFor({ files: ['src/index.ts'], text: 'See [source](./src/).' }),
    ).toEqual([]);
  });
});

describe('a path only the author repository has', () => {
  it('is reported from a backticked token', () => {
    expect(
      findingsFor({ text: 'The register lives in `docs/coordination/`.' }),
    ).toEqual([
      expect.stringContaining(
        'names `docs/coordination/`, a path only the repository',
      ),
    ]);
  });

  it('is reported once however many times the document names it', () => {
    expect(
      findingsFor({
        text: '`docs/decisions/` holds them.\nSee `docs/decisions/` again.',
      }),
    ).toHaveLength(1);
  });

  it('leaves a path anchored nowhere in the roster alone', () => {
    expect(findingsFor({ text: 'Wrap it in `try/catch`.' })).toEqual([]);
  });

  it('leaves an example inside a fenced block alone', () => {
    expect(
      findingsFor({
        text: '```json\n{ "dir": "docs/decisions" }\n```\n',
      }),
    ).toEqual([]);
  });
});

describe('a decision citation', () => {
  it('is reported when nothing on the line can be opened', () => {
    expect(findingsFor({ text: 'The split is ADR-038.' })).toEqual([
      expect.stringContaining('cites ADR-038 with no absolute URL on the line'),
    ]);
  });

  it('passes when the line carries an absolute URL', () => {
    expect(
      findingsFor({
        text: 'The split is [ADR-038](https://example.test/ADR-038-x.md).',
      }),
    ).toEqual([]);
  });

  it('reports each line, so one good link does not cover six bare names', () => {
    expect(
      findingsFor({
        text: 'See [ADR-038](https://example.test/a.md).\nAlso ADR-039.\nAnd ADR-040.',
      }),
    ).toHaveLength(2);
  });
});

describe('proseLines', () => {
  it('keeps the original line numbers across a fenced block', () => {
    expect(
      proseLines('one\n```\ntwo\n```\nfive').map(({ number }) => number),
    ).toEqual([1, 5]);
  });
});

describe('shippedDocuments', () => {
  it('takes the markdown a consumer receives, in a stable order', () => {
    expect(
      shippedDocuments(['src/b.md', 'README.md', 'src/index.ts', 'src/a.md']),
    ).toEqual(['README.md', 'src/a.md', 'src/b.md']);
  });

  it('leaves the dated and placeholder records to the corpus rule', () => {
    // A changelog names paths as they were and a template's paths are meant to
    // be replaced — the same exemptions the in-repo doc gates already apply, so
    // that two walkers cannot drift into two notions of "ignored".
    expect(
      shippedDocuments(['CHANGELOG.md', 'assets/tasks/_TEMPLATE.md']),
    ).toEqual([]);
  });
});

describe('packageFindings', () => {
  const packed = {
    files: ['README.md', 'package.json'],
    name: '@scope/thing',
    readFile: () => 'The rule is ADR-001.',
    repoOnlyDirs: REPO_ONLY,
  };

  it('names the package a consumer would install', () => {
    expect(packageFindings(packed).findings).toEqual([
      expect.stringContaining('@scope/thing: README.md:1'),
    ]);
  });

  it('reports what it read, so a corpus of nothing is visible', () => {
    expect(packageFindings(packed).documents).toEqual(['README.md']);
    expect(
      packageFindings({ ...packed, files: ['package.json'] }).documents,
    ).toEqual([]);
  });
});

describe('the two refusals', () => {
  // Both exist because "every shipped document reads correctly" is trivially
  // true of a set with no documents in it, and reads afterwards exactly like a
  // set that was checked.
  it('refuses a roster that names no package', () => {
    expect(rosterProblem([])).toContain('publishing.publicPackageDirs');
    expect(rosterProblem(['ui'])).toBeUndefined();
  });

  it('refuses a corpus that holds no document', () => {
    expect(corpusProblem(0)).toContain('read nothing');
    expect(corpusProblem(1)).toBeUndefined();
  });
});
