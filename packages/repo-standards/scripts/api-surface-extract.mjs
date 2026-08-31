/**
 * Extracts a package's exported type surface with ts-morph
 * (verify-api-surface.mjs).
 *
 * For each concrete entry a consumer can import, this enumerates the exported
 * names and renders a normalized signature per name, so the diff can list every
 * added/removed/changed export. Signatures are name-based: an exported type
 * alias expands to its written body (a reshaped union is caught), while a value
 * keeps its referenced type names (a changed arity/param/return is caught). A
 * change confined to a non-exported referenced type is out of scope — the ADR
 * records this boundary. Absolute `import("…")` paths are stripped so the
 * snapshot is machine-independent.
 */
import { Project, ts } from 'ts-morph';

const TYPE_FORMAT = ts.TypeFormatFlags.NoTruncation;

const KIND_LABELS = {
  ClassDeclaration: 'class',
  EnumDeclaration: 'enum',
  FunctionDeclaration: 'function',
  InterfaceDeclaration: 'interface',
  TypeAliasDeclaration: 'type',
  VariableDeclaration: 'const',
};

const normalizeSignature = (text) =>
  text
    .replace(/import\("[^"]*"\)\./g, '')
    .replace(/\s+/g, ' ')
    .trim();

const rawSignatureFor = (declaration) => {
  if (declaration.getKindName() === 'TypeAliasDeclaration') {
    const node = declaration.getTypeNode();
    if (node !== undefined) {
      return node.getText();
    }
  }
  return declaration.getType().getText(declaration, TYPE_FORMAT);
};

const signatureFor = (declarations) => {
  const [declaration] = declarations;
  const kind = KIND_LABELS[declaration.getKindName()] ?? 'value';
  return `[${kind}] ${normalizeSignature(rawSignatureFor(declaration))}`;
};

const extractEntry = (sourceFile) => {
  const exported = sourceFile.getExportedDeclarations();
  return Object.fromEntries(
    [...exported.entries()]
      .map(([name, declarations]) => [name, signatureFor(declarations)])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
};

const createProject = (packageConfig) =>
  packageConfig.tsConfigFilePath === undefined
    ? new Project({
        compilerOptions: {
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          skipLibCheck: true,
          strict: true,
          target: ts.ScriptTarget.ESNext,
        },
        skipAddingFilesFromTsConfig: true,
      })
    : new Project({
        skipAddingFilesFromTsConfig: true,
        tsConfigFilePath: packageConfig.tsConfigFilePath,
      });

export const extractSurface = (packageConfig) => {
  const project = createProject(packageConfig);
  const loaded = packageConfig.entries.map((entry) => ({
    ...entry,
    sourceFile: project.addSourceFileAtPath(entry.entryFile),
  }));
  project.resolveSourceFileDependencies();

  return Object.fromEntries(
    loaded.map(({ sourceFile, subpath }) => [
      subpath,
      extractEntry(sourceFile),
    ]),
  );
};
