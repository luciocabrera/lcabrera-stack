import { describe, expect, it } from 'vite-plus/test';

import { conformanceMessages } from './conformance-fixtures.mjs';

const skillWith = (description) => `---
name: demo
description: ${description}
---

# Demo
`;

const vague = (reason) =>
  `Vague description in .github/skills/demo/SKILL.md: ${reason}`;

const nothingConcrete = vague(
  'names nothing concrete — no path, command or named subject',
);

describe('conformance triggers — planted vague descriptions', () => {
  it.each([
    {
      description: 'Code quality helper.',
      message: vague('3 words is under the 12-word floor'),
      planted: 'a description too short to carry a situation',
    },
    {
      description:
        'Helps the team keep things in good shape whenever the work starts to feel messy or slow.',
      message: nothingConcrete,
      planted: 'a description that names nothing concrete',
    },
    {
      description:
        'Helps the team keep things tidy and/or fast whenever the work starts to feel messy or slow.',
      message: nothingConcrete,
      planted: 'a description whose only slash is the one in "and/or"',
    },
    {
      description:
        'Helps whenever the work I am asked to do starts to feel messy, slow or hard to reason about.',
      message: nothingConcrete,
      planted: 'a description whose only capital is a lone mid-sentence "I"',
    },
    {
      description:
        'Runs `vp run check:safe` across apps/showcase and packages/ui, then writes a JSON report into reports/.',
      message: vague(
        'names no situation that selects it — say when it applies, what it follows, or what dispatches it',
      ),
      planted: 'a description that never says when it applies',
    },
  ])('reports $planted', ({ description, message }) => {
    expect(
      conformanceMessages({
        '.github/skills/demo/SKILL.md': skillWith(description),
      }),
    ).toContain(message);
  });

  it.each([
    {
      description:
        'Use whenever you are doing any task at all, in any file such as README.md or anything else.',
      phrase: 'any task',
    },
    {
      description:
        'Use for every request a user makes in this repo, whether it touches src/ or README.md files.',
      phrase: 'every request',
    },
    {
      description:
        'Use when editing any file, from README.md to a script under scripts/ or a config at the root.',
      phrase: 'any file',
    },
    {
      description:
        'Use when editing any file. It covers README.md, the scripts under scripts/ and the root config.',
      phrase: 'any file',
    },
    {
      description:
        'Use for any other kind of task, from README.md to the scripts under scripts/ and the config at the root.',
      phrase: 'any other kind of task',
    },
    {
      description:
        'Use for any kind of other task, from README.md to the scripts under scripts/ and the config at the root.',
      phrase: 'any kind of other task',
    },
    {
      description:
        'Use for all kinds of work, from README.md to the scripts under scripts/ and the config at the root.',
      phrase: 'all kinds of work',
    },
    {
      description:
        'Use when reviewing README.md, a script in scripts/, or anything else that the user has opened.',
      phrase: 'anything else',
    },
    {
      description:
        'Use whenever the user asks about README.md or the scripts under scripts/ at all, in any wording.',
      phrase: 'at all',
    },
  ])(
    'reports a description claiming every task through "$phrase"',
    ({ description, phrase }) => {
      expect(
        conformanceMessages({
          '.github/skills/demo/SKILL.md': skillWith(description),
        }),
      ).toEqual([
        vague(
          `"${phrase}" would select it for every task — name the situation that sets it apart`,
        ),
      ]);
    },
  );

  it.each([
    'Use when finishing any code change, before a PR is opened from the branch it was made on.',
    'Use when editing any file under docs/product/, or when writing acceptance criteria for a package.',
    'Use when editing any file in docs/product/, before the pull request for that change is opened.',
    'Use when making any change to packages/ui, before a changeset is written for that package.',
    'Use when editing any file-scoped rule under .claude/rules/, before the gate is run on it.',
    "Use when editing any file's frontmatter under .github/skills, before the gate is run on it.",
    'Use when editing any file’s frontmatter under .github/skills, before the gate is run on it.',
    'Use when changing every request-scoped cache in packages/server, before a changeset is written.',
    'Use for every task in packages/devkit/assets, after the blueprint has been copied into a repo.',
    'Use when answering any question about `vp run harness:verify`, before its findings are acted on.',
    'Use when reviewing every request for a new ADR, before the number is taken with `vp run adr:verify`.',
    "Use when editing any file inside a workspace's scripts/lib directory, before the gate is run on it.",
    'Use when editing any file beneath packages/ui, before a changeset is written for the package.',
    'Use when changing any file that a workspace ships to npm, before `vp run tarball:verify` runs.',
    'Use before building anything new, after reading the INVENTORY.md of the workspace it lands in.',
    'Use when editing anything under docs/product/ or planning a change to a package a consumer installs.',
  ])('accepts a scoped quantifier: %s', (description) => {
    expect(
      conformanceMessages({
        '.github/skills/demo/SKILL.md': skillWith(description),
      }),
    ).toEqual([]);
  });

  it('takes a script path as something concrete', () => {
    expect(
      conformanceMessages({
        '.github/skills/demo/SKILL.md': skillWith(
          'Runs scripts/foo.mjs whenever the fixture asks for a concrete path to be named in a description.',
        ),
        'scripts/foo.mjs': 'export {};\n',
      }),
    ).toEqual([]);
  });

  it('reads a block-scalar description as its text, not as the block marker', () => {
    expect(
      conformanceMessages({
        '.github/skills/demo/SKILL.md': `---
name: demo
description: |
  Standards for the demo fixture, which nothing else in scripts/lib covers.
  Use when a test needs a folded description that still passes every check.
---

# Demo
`,
      }),
    ).toEqual([]);
  });
});
