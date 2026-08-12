// ✅ Enforces the folder pairing for shared `*.types.ts` / `*.constants.ts`
// modules, so the rule in .claude/rules/typescript.md is checked by the gate
// instead of caught by eye in review. It drifted twice before this existed:
// `errors/pg-error-fields.types.ts` (#389), and a domain folder that grew three
// `*.constants.ts` files where the convention allows one (#599).
//
// Three folder shapes exist and only one takes the rule:
//
//   Domain folder    the folder name IS the subject → `<folder>.types.ts`.
//                    "Exactly one of each" falls out of the naming: two files
//                    in one folder cannot both be `<folder>.constants.ts`.
//   Artifact folder  holds one component, context or route module → the file
//                    is named after the artifact (`TableConfigContext.types.ts`).
//   Catch-all folder the folder names a KIND, not a subject (`types/`,
//                    `constants/`, `utils/`) → named after its subject.
//                    `types/types.types.ts` is the reductio.
//
// The shape is decided from the PATH ALONE, which is the whole difficulty: the
// obvious discriminator — PascalCase means artifact — separates a component
// folder from a domain folder but not a ROUTE one, and `trigger-scan/` and
// `group-query-builder/` are both kebab-case with only the first allowed to name
// a file after its contents. Reading the directory for a marker file would tell
// them apart, and this rule deliberately does not: the eslint pass that runs it
// is not type-aware, so there is no program to enumerate siblings from, and the
// remaining route — a non-literal `fs` call — is what
// `security/detect-non-literal-fs-filename` forbids in a package that may not
// suppress a finding. So `artifactFolders` names the subtrees whose folders are
// route containers, and PascalCase covers the rest. Measured against every
// `*.types.ts`/`*.constants.ts` in this repo, that classifies identically to the
// directory-reading version, and its false-positive set is empty.

import type { TSESTree } from '@typescript-eslint/utils';

import { ESLintUtils } from '@typescript-eslint/utils';
import path from 'node:path';

import { parseFileName } from './file-names.ts';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/luciocabrera/vite-react-compiler/rules/${name}`,
);

type FolderShape = 'artifact' | 'domain' | 'exempt';

type MessageIds = 'artifactNamed' | 'folderNamed';

// A single optional options object; each key REPLACES its default wholesale
// rather than extending it, matching `filename-convention`'s option shape.
//
// `artifactFolders` names the directories whose whole subtree holds route
// modules. Everything under one is exempt, because a route folder is a URL
// segment and its modules are named for the route, which is not always the same
// word (`routes/car-sales-infinite/CarSales.component.tsx`).
//
// `catchAllFolders` names the directories that name a kind rather than a
// subject. `pairedSuffixes` names the file suffixes the pairing applies to —
// deliberately not `.schema`/`.service`/`.api`, which have no settled
// convention yet and would be a guess.
type Options = readonly [
  {
    readonly artifactFolders?: readonly string[];
    readonly catchAllFolders?: readonly string[];
    readonly pairedSuffixes?: readonly string[];
  }?,
];

const DEFAULT_ARTIFACT_FOLDERS = ['routes'] as const;

const DEFAULT_CATCH_ALL_FOLDERS = [
  'actions',
  'config',
  'constants',
  'contexts',
  'helpers',
  'hooks',
  'queries',
  'schemas',
  'selectors',
  'services',
  // A package root is not a domain folder — the package is the domain, and
  // `src/src.types.ts` is the same reductio as `types/types.types.ts`.
  'src',
  'types',
  'utils',
] as const;

const DEFAULT_PAIRED_SUFFIXES = ['constants', 'types'] as const;

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const NON_ALPHANUMERIC = /[^a-z0-9]/g;

/**
 * One spelling of a subject, so the three the repo uses for it compare equal:
 * `trigger-scan`, `triggerScan` and `TriggerScan` all name the same thing, and
 * which one a file gets is decided by what it holds, not by what it is about.
 */
const normalize = (value: string) =>
  value.toLowerCase().replaceAll(NON_ALPHANUMERIC, '');

type FolderShapeForArgs = {
  readonly artifactFolders: ReadonlySet<string>;
  readonly catchAllFolders: ReadonlySet<string>;
  readonly folder: string;
  readonly segments: readonly string[];
};

const folderShapeFor = ({
  artifactFolders,
  catchAllFolders,
  folder,
  segments,
}: FolderShapeForArgs): FolderShape => {
  if (catchAllFolders.has(folder)) {
    return 'exempt';
  }
  // An artifact TREE is exempt outright rather than checked against the folder
  // name, because a route module is named for its route and that is not always
  // the folder: `routes/car-sales-infinite/` holds `CarSales.component.tsx`.
  // This is the rule's known blind spot, and the price of not reading the
  // directory — see the header.
  if (segments.some((segment) => artifactFolders.has(segment))) {
    return 'exempt';
  }
  if (PASCAL_CASE.test(folder)) {
    return 'artifact';
  }
  return 'domain';
};

/**
 * The directory segments of `filename`, relative to where ESLint was invoked.
 * Relative so that an ancestor of the project — a checkout that happens to sit
 * under a directory called `routes` — cannot exempt the whole workspace.
 */
type DirectorySegmentsArgs = {
  readonly cwd: string;
  readonly filename: string;
};

const directorySegments = ({ cwd, filename }: DirectorySegmentsArgs) =>
  path.relative(cwd, path.dirname(filename)).split(/[/\\]/);

export default createRule<Options, MessageIds>({
  create(context) {
    const [options] = context.options;
    const artifactFolders = new Set<string>(
      options?.artifactFolders ?? DEFAULT_ARTIFACT_FOLDERS,
    );
    const catchAllFolders = new Set<string>(
      options?.catchAllFolders ?? DEFAULT_CATCH_ALL_FOLDERS,
    );
    const pairedSuffixes = new Set<string>(
      options?.pairedSuffixes ?? DEFAULT_PAIRED_SUFFIXES,
    );

    return {
      Program(node: TSESTree.Program) {
        const parsed = parseFileName(context.filename);
        if (parsed === undefined || !pairedSuffixes.has(parsed.suffix)) {
          return;
        }

        const segments = directorySegments({
          cwd: context.cwd,
          filename: context.filename,
        });
        const folder = segments.at(-1) ?? '';
        if (folder === '') {
          return;
        }

        const shape = folderShapeFor({
          artifactFolders,
          catchAllFolders,
          folder,
          segments,
        });
        if (shape === 'exempt') {
          return;
        }

        const data = { folder, name: parsed.name, suffix: parsed.suffix };
        const subject = normalize(folder);
        const named = normalize(parsed.name);

        if (shape === 'artifact') {
          if (!named.startsWith(subject)) {
            context.report({ data, messageId: 'artifactNamed', node });
          }
          return;
        }

        if (named !== subject) {
          context.report({ data, messageId: 'folderNamed', node });
        }
      },
    };
  },
  defaultOptions: [{}],
  meta: {
    docs: {
      description:
        "Enforce that a domain folder's shared types/constants module is named after the folder, and an artifact folder's after its artifact",
    },
    messages: {
      artifactNamed:
        "'{{folder}}/' holds one artifact, so its '.{{suffix}}' file is named after that artifact — '{{name}}.{{suffix}}' does not name '{{folder}}'. Rename the file (git mv) and update its imports.",
      // States the convention, never the folder's contents: the rule sees one
      // file at a time and has not counted anything, so "there is exactly one"
      // would be a claim it cannot make — and would read as false in the very
      // case it exists for, a folder holding several misnamed files.
      folderNamed:
        "A domain folder takes one '.{{suffix}}' file, named after the folder — rename '{{name}}.{{suffix}}' to '{{folder}}.{{suffix}}' (git mv), merging it into that file if one is already there.",
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          artifactFolders: { items: { type: 'string' }, type: 'array' },
          catchAllFolders: { items: { type: 'string' }, type: 'array' },
          pairedSuffixes: { items: { type: 'string' }, type: 'array' },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
  name: 'domain-folder-filename',
});
