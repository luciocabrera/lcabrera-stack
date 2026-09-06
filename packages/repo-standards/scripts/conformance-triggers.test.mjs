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
