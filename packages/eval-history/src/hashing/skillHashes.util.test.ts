import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { HashedFile } from './hashing.types.ts';

import { readFileSet } from './readFileSet.service.ts';
import { skillHashes } from './skillHashes.util.ts';

type ReplaceFileArgs = {
  readonly target: string;
  readonly update: (text: string) => string;
};

type SkillSourceArgs = {
  readonly description: string;
  readonly name: string;
};

const skillSource = ({ description, name }: SkillSourceArgs) =>
  `---\nname: ${name}\ndescription: ${description}\nuser-invocable: true\n---\n\n# ${name}\n\nLine one.\nLine two.\n`;

const files: readonly HashedFile[] = [
  {
    bytes: skillSource({ description: 'Use for alpha.', name: 'alpha' }),
    path: 'alpha/SKILL.md',
  },
  { bytes: 'Alpha detail.\n', path: 'alpha/references/detail.md' },
  {
    bytes: skillSource({ description: 'Use for beta.', name: 'beta' }),
    path: 'beta/SKILL.md',
  },
  { bytes: 'Beta detail.\n', path: 'beta/references/detail.md' },
  { bytes: 'Not a skill.\n', path: 'README.md' },
  { bytes: 'Not a skill.\n', path: 'notes/README.md' },
];

const hashesByKey = (input: readonly HashedFile[]) => {
  const { catalog_hash, skills } = skillHashes(input);
  const entries = skills.map(
    ({ content_hash, name }) => [name, content_hash] as const,
  );

  return new Map<string, string>([['catalog', catalog_hash], ...entries]);
};

const changedKeys = (input: readonly HashedFile[]) => {
  const before = hashesByKey(files);
  const after = hashesByKey(input);

  return before
    .keys()
    .filter((key) => before.get(key) !== after.get(key))
    .toArray();
};

const replaceFile = ({ target, update }: ReplaceFileArgs) =>
  files.map((file) =>
    file.path === target
      ? { ...file, bytes: update(file.bytes.toString()) }
      : file,
  );

describe('skillHashes', () => {
  it('hashes every directory whose SKILL.md sits at its top, sorted by name', () => {
    const { catalog_hash, skills } = skillHashes(files.toReversed());

    expect(skills.map(({ name }) => name)).toEqual(['alpha', 'beta']);
    expect(catalog_hash).toMatch(/^[0-9a-f]{64}$/u);
  });

  it('moves only that skill’s content hash when one body line changes', () => {
    const edited = replaceFile({
      target: 'alpha/SKILL.md',
      update: (text) => text.replace('Line two.', 'Line 2.'),
    });

    expect(changedKeys(edited)).toEqual(['alpha']);
  });

  it('moves only that skill’s content hash when a file beside SKILL.md changes', () => {
    const edited = replaceFile({
      target: 'beta/references/detail.md',
      update: () => 'Changed.\n',
    });

    expect(changedKeys(edited)).toEqual(['beta']);
  });

  it('moves that skill’s content hash and the catalog hash when its description changes', () => {
    const edited = replaceFile({
      target: 'alpha/SKILL.md',
      update: (text) =>
        text.replace('Use for alpha.', 'Use for alpha and gamma.'),
    });

    expect(changedKeys(edited)).toEqual(['catalog', 'alpha']);
  });

  it('moves no hash when the files are rewritten with CRLF line endings', () => {
    const edited = files.map((file) => ({
      ...file,
      bytes: file.bytes.toString().replaceAll('\n', '\r\n'),
    }));

    expect(changedKeys(edited)).toEqual([]);
  });

  it('reads this repository’s skills, where a body edit moves one hash', async () => {
    const directory = fileURLToPath(
      new URL('../../../../.github/skills', import.meta.url),
    );
    const repositoryFiles = await readFileSet({ directory });
    const { skills } = skillHashes(repositoryFiles);
    const [first] = skills;
    const target = `${first?.name}/SKILL.md`;
    const edited = repositoryFiles.map((file) =>
      file.path === target
        ? { ...file, bytes: `${file.bytes.toString()}\nOne more line.\n` }
        : file,
    );
    const after = skillHashes(edited);

    expect(skills.length).toBeGreaterThan(1);
    expect(after.catalog_hash).toBe(skillHashes(repositoryFiles).catalog_hash);
    expect(
      after.skills
        .filter(
          ({ content_hash }, index) =>
            content_hash !== skills[index]?.content_hash,
        )
        .map(({ name }) => name),
    ).toEqual([first?.name]);
  });
});
