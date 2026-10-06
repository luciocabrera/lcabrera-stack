import { describe, expect, it } from 'vite-plus/test';

import { skillCatalogEntry } from './skillCatalogEntry.util.ts';

describe('skillCatalogEntry', () => {
  it('reads name, description and paths from the frontmatter', () => {
    expect(
      skillCatalogEntry(
        "---\r\nname: alpha\r\ndescription: >\r\n  Use for alpha.\r\npaths: ['**/*.ts']\r\nallowed-tools: Read\r\n---\r\n\r\n# Alpha\r\n",
      ),
    ).toEqual({
      description: 'Use for alpha.\n',
      name: 'alpha',
      paths: ['**/*.ts'],
    });
  });

  it('returns no fields for a file without frontmatter', () => {
    expect(skillCatalogEntry('# no frontmatter')).toEqual({});
  });

  it('leaves paths out when it is not a list of strings', () => {
    expect(skillCatalogEntry('---\nname: a\npaths: 3\n---\n')).toEqual({
      name: 'a',
    });
  });
});
