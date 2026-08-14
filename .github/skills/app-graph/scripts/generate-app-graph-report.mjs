#!/usr/bin/env node
// Deterministic app-graph scanner (ADR-022, Phase-3 Step 8). An INVENTORY,
// not an audit: walks the scan scope, builds the nested folder/file node
// tree (with per-file export/function/type counts via ts-morph) and emits
// app-graph.raw.json + a canonical 0-findings report.json + report.md.
// Honors the shared deterministic-runner flag contract
// (--target/--scope/--output-dir/--skip-ingest).
//
// ts-morph is resolved from the HOST repo's node_modules (same technique as
// the fallow bin) — an arbitrary registered target needs no install. Files
// are parsed one at a time and forgotten immediately, so memory stays flat
// on large targets. The directory skip list mirrors
// buildFileInventory.util.ts so the node tree and the generic run_files
// inventory describe the same file set.

import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, relative } from 'node:path';

import {
  hostRoot,
  ingestScanArtifacts,
  makeTimestamp,
  parseRunContext,
  resolveOutputDirectory,
  writeArtifacts,
} from '@repo/scan-report/deterministic-scan';

const context = parseRunContext();

// An arbitrary target can break the walk or the parser — degrade this one
// scanner gracefully (0 findings, failure noted in top_risk) rather than
// crash the whole scan (ADR-015).
const toolFailures = [];

// Mirrors buildFileInventory.util.ts's IGNORED_DIRECTORIES.
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.react-router',
  '.tmp',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

const ANALYZABLE_EXTENSIONS = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
]);

// Same convention as buildFileInventory.util.ts's getExtension — dotfiles
// like `.gitignore` keep their full name as the "extension".
const getExtension = (fileName) => {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? '' : fileName.slice(dotIndex);
};

const resolveTsMorph = () => {
  try {
    const require = createRequire(import.meta.url);
    const packageJsonPath = require.resolve('ts-morph/package.json', {
      paths: [hostRoot],
    });
    const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return { tsMorph: require('ts-morph'), version };
  } catch (error) {
    toolFailures.push(
      `ts-morph unavailable — symbol counts are zeroed: ${error.message}`,
    );
    return { tsMorph: undefined, version: undefined };
  }
};

const { tsMorph, version: tsMorphVersion } = resolveTsMorph();

const project = tsMorph
  ? new tsMorph.Project({
      compilerOptions: { allowJs: true },
      skipAddingFilesFromTsConfig: true,
      skipFileDependencyResolution: true,
      skipLoadingLibFiles: true,
    })
  : undefined;

// Top-level export statements: named exports count individually,
// `export * from` counts once, an exported variable statement counts one
// per declaration.
const countExports = (sourceFile) => {
  let count = 0;
  for (const statement of sourceFile.getStatements()) {
    if (tsMorph.Node.isExportDeclaration(statement)) {
      const namedExportCount = statement.getNamedExports().length;
      count += namedExportCount > 0 ? namedExportCount : 1;
    } else if (tsMorph.Node.isExportAssignment(statement)) {
      count += 1;
    } else if (tsMorph.Node.isExportable(statement) && statement.isExported()) {
      count += tsMorph.Node.isVariableStatement(statement)
        ? statement.getDeclarations().length
        : 1;
    }
  }
  return count;
};

// Declared functions: function/method declarations anywhere, plus arrow/
// function expressions bound to a name (variable declaration or object
// property) — inline callbacks deliberately don't count.
const countFunctions = (sourceFile) => {
  const { SyntaxKind } = tsMorph;
  let count = 0;
  sourceFile.forEachDescendant((node) => {
    const kind = node.getKind();
    if (
      kind === SyntaxKind.FunctionDeclaration ||
      kind === SyntaxKind.MethodDeclaration
    ) {
      count += 1;
      return;
    }
    if (
      kind !== SyntaxKind.ArrowFunction &&
      kind !== SyntaxKind.FunctionExpression
    ) {
      return;
    }
    const parentKind = node.getParent()?.getKind();
    if (
      parentKind === SyntaxKind.VariableDeclaration ||
      parentKind === SyntaxKind.PropertyAssignment
    ) {
      count += 1;
    }
  });
  return count;
};

// Top-level type declarations: interfaces + type aliases + enums.
const countTypes = (sourceFile) =>
  sourceFile.getInterfaces().length +
  sourceFile.getTypeAliases().length +
  sourceFile.getEnums().length;

// Mirrors classifyFileTypeCategory.util.ts's suffix convention (same
// technique this file already uses for IGNORED_DIRECTORIES) — only needed
// here to gate the component/hook naming heuristic below, so the full
// category list is kept for parity even though only 'component'/'hook'
// drive a decision.
const CATEGORY_SUFFIXES = [
  { category: 'test', suffix: '.test.tsx' },
  { category: 'test', suffix: '.test.ts' },
  { category: 'test', suffix: '.spec.tsx' },
  { category: 'test', suffix: '.spec.ts' },
  { category: 'component', suffix: '.component.tsx' },
  { category: 'component', suffix: '.component.ts' },
  { category: 'hook', suffix: '.hook.ts' },
  { category: 'hook', suffix: '.hook.tsx' },
  { category: 'util', suffix: '.util.ts' },
  { category: 'util', suffix: '.util.tsx' },
  { category: 'service_api', suffix: '.api.ts' },
  { category: 'repository', suffix: '.repository.ts' },
  { category: 'controller', suffix: '.controller.ts' },
  { category: 'route', suffix: '.route.ts' },
  { category: 'route', suffix: '.route.tsx' },
  { category: 'types', suffix: '.types.ts' },
  { category: 'stylex', suffix: '.stylex.ts' },
  { category: 'constants', suffix: '.constants.ts' },
  { category: 'schema', suffix: '.schema.ts' },
];

const classifyFileTypeCategory = (fileName) =>
  CATEGORY_SUFFIXES.find(({ suffix }) => fileName.endsWith(suffix))?.category ??
  'other';

// Symbol-node kinds (ADR-027): every named function/method/class/
// interface/type-alias/enum, recursively to arbitrary depth. Matches
// countFunctions' existing exclusion — an ArrowFunction/FunctionExpression
// only counts when bound to a name (VariableDeclaration or
// PropertyAssignment); inline anonymous callbacks never become nodes.
const SYMBOL_NODE_TYPE_BY_KIND = tsMorph
  ? new Map([
      [tsMorph.SyntaxKind.FunctionDeclaration, 'function'],
      [tsMorph.SyntaxKind.MethodDeclaration, 'method'],
      [tsMorph.SyntaxKind.ClassDeclaration, 'class'],
      [tsMorph.SyntaxKind.InterfaceDeclaration, 'interface'],
      [tsMorph.SyntaxKind.TypeAliasDeclaration, 'type_alias'],
      [tsMorph.SyntaxKind.EnumDeclaration, 'enum'],
      [tsMorph.SyntaxKind.ArrowFunction, 'function'],
      [tsMorph.SyntaxKind.FunctionExpression, 'function'],
    ])
  : new Map();

// True for an ArrowFunction/FunctionExpression bound to a variable
// declaration or object property name — the same parentKind check
// countFunctions already uses.
const isBoundFunctionLike = (node, kind) => {
  const { SyntaxKind } = tsMorph;
  if (
    kind !== SyntaxKind.ArrowFunction &&
    kind !== SyntaxKind.FunctionExpression
  ) {
    return false;
  }
  const parentKind = node.getParent()?.getKind();
  return (
    parentKind === SyntaxKind.VariableDeclaration ||
    parentKind === SyntaxKind.PropertyAssignment
  );
};

const isSymbolCandidate = (node, kind) => {
  const { SyntaxKind } = tsMorph;
  if (!SYMBOL_NODE_TYPE_BY_KIND.has(kind)) return false;
  if (
    kind === SyntaxKind.ArrowFunction ||
    kind === SyntaxKind.FunctionExpression
  ) {
    return isBoundFunctionLike(node, kind);
  }
  return true;
};

// The declared name, or undefined for an anonymous declaration/expression
// (e.g. `export default function () {}`, a computed method name) — such
// nodes don't become their own node but recursion still continues through
// them with the current parent unchanged.
const getDeclaredName = (node, kind) => {
  const { SyntaxKind } = tsMorph;
  try {
    if (
      kind === SyntaxKind.ArrowFunction ||
      kind === SyntaxKind.FunctionExpression
    ) {
      const bindingNode = node.getParent();
      return typeof bindingNode?.getName === 'function'
        ? bindingNode.getName()
        : undefined;
    }
    return typeof node.getName === 'function' ? node.getName() : undefined;
  } catch {
    return undefined;
  }
};

// Whether the top-level `export` statement targets this declaration.
// MethodDeclaration has no export modifier of its own (class members
// aren't independently exported) and always reports false.
const getIsExported = (node, kind) => {
  const { SyntaxKind } = tsMorph;
  if (
    kind === SyntaxKind.ArrowFunction ||
    kind === SyntaxKind.FunctionExpression
  ) {
    const bindingNode = node.getParent();
    if (bindingNode?.getKind() === SyntaxKind.VariableDeclaration) {
      const statement = bindingNode.getVariableStatement?.();
      return statement ? statement.isExported() : false;
    }
    return false;
  }
  return typeof node.isExported === 'function' ? node.isExported() : false;
};

const isPascalCaseName = (name) => /^[A-Z][A-Za-z0-9]*$/.test(name);
const isHookName = (name) => /^use[A-Z0-9]/.test(name);

// Mutates fileNode in place with the computed counts (and, on success,
// the ADR-027 symbol nodes beneath it) — fileNode is already the object
// pushed into `nodes`, so this is the only place that needs the file's
// counts, keeping the per-file createSourceFile/forget() lifecycle intact
// (the symbol walk runs BEFORE forget(), never after — a forgotten
// SourceFile's descendants are no longer usable).
const analyzeSourceText = ({ fileCategory, fileNode, filePath, text }) => {
  if (!project) return;
  try {
    const sourceFile = project.createSourceFile(filePath, text, {
      overwrite: true,
    });
    fileNode.export_count = countExports(sourceFile);
    fileNode.function_count = countFunctions(sourceFile);
    fileNode.type_count = countTypes(sourceFile);
    fileNode.is_analyzed = true;
    walkForSymbols(
      sourceFile,
      {
        isFile: true,
        nestedLevel: fileNode.nested_level,
        nodeId: fileNode.node_id,
      },
      { fileCategory, filePath },
    );
    sourceFile.forget();
  } catch (error) {
    toolFailures.push(`parse failed for ${filePath}: ${error.message}`);
  }
};

const nodes = [];
let nextNodeId = 0;

const makeNode = (fields) => {
  nextNodeId += 1;
  const node = { node_id: nextNodeId, ...fields };
  nodes.push(node);
  return node;
};

const makeSymbolNode = ({
  fileCategory,
  filePath,
  isTopLevel,
  name,
  nodeType,
  parentNestedLevel,
  parentNodeId,
  tsNode,
}) => {
  const isExported = getIsExported(tsNode, tsNode.getKind());
  const isComponent =
    isTopLevel &&
    isExported &&
    fileCategory === 'component' &&
    isPascalCaseName(name);
  const isHook =
    isTopLevel && isExported && fileCategory === 'hook' && isHookName(name);

  return makeNode({
    child_file_count: 0,
    child_folder_count: 0,
    end_line: tsNode.getEndLineNumber(),
    export_count: 0,
    extension: '',
    function_count: 0,
    ...(isComponent && { is_component: true }),
    is_exported: isExported,
    ...(isHook && { is_hook: true }),
    line_count: null,
    name,
    nested_level: parentNestedLevel + 1,
    node_type: nodeType,
    parent_node_id: parentNodeId,
    path: filePath,
    start_line: tsNode.getStartLineNumber(),
    symbol_name: name,
    type_count: 0,
  });
};

// Recursive walker (ADR-027): visits every immediate child via
// forEachChildAsArray (not the flattened forEachDescendant countFunctions
// uses) so nesting is tracked precisely — a candidate declaration becomes
// its own node parented to the current container, and its own subtree is
// then walked with itself as the new container. Non-candidate nodes (an
// `if` block, a plain call expression, …) recurse with the container
// unchanged, so a helper nested arbitrarily deep inside ordinary control
// flow still resolves back to the nearest enclosing named declaration (or
// the file, if none).
const walkForSymbols = (containerTsNode, parentContext, fileContext) => {
  for (const child of containerTsNode.forEachChildAsArray()) {
    const kind = child.getKind();
    if (!isSymbolCandidate(child, kind)) {
      walkForSymbols(child, parentContext, fileContext);
      continue;
    }

    const name = getDeclaredName(child, kind);
    if (!name) {
      walkForSymbols(child, parentContext, fileContext);
      continue;
    }

    const symbolNode = makeSymbolNode({
      fileCategory: fileContext.fileCategory,
      filePath: fileContext.filePath,
      isTopLevel: parentContext.isFile,
      name,
      nodeType: SYMBOL_NODE_TYPE_BY_KIND.get(kind),
      parentNestedLevel: parentContext.nestedLevel,
      parentNodeId: parentContext.nodeId,
      tsNode: child,
    });

    walkForSymbols(
      child,
      {
        isFile: false,
        nestedLevel: symbolNode.nested_level,
        nodeId: symbolNode.node_id,
      },
      fileContext,
    );
  }
};

const makeFileNode = ({ absolutePath, name, nestedLevel, parentNodeId }) => {
  const extension = getExtension(name);
  const filePath = relative(context.gitRoot, absolutePath);
  let text;
  try {
    text = readFileSync(absolutePath, 'utf8');
  } catch {
    text = undefined;
  }

  // The file node is created FIRST (before parsing) so its node_id exists
  // to parent any symbol nodes analyzeSourceText discovers underneath it.
  const fileNode = makeNode({
    child_file_count: 0,
    child_folder_count: 0,
    export_count: 0,
    extension,
    function_count: 0,
    line_count: text === undefined ? null : text.split('\n').length,
    name,
    nested_level: nestedLevel,
    node_type: 'file',
    parent_node_id: parentNodeId,
    path: filePath,
    type_count: 0,
  });

  if (text !== undefined && ANALYZABLE_EXTENSIONS.has(extension)) {
    analyzeSourceText({
      fileCategory: classifyFileTypeCategory(name),
      fileNode,
      filePath,
      text,
    });
  }

  return fileNode;
};

const walkDirectory = ({ absolutePath, nestedLevel, parentNodeId }) => {
  const relativePath = relative(context.gitRoot, absolutePath);
  const folderNode = makeNode({
    child_file_count: 0,
    child_folder_count: 0,
    export_count: 0,
    extension: '',
    function_count: 0,
    line_count: null,
    name: basename(absolutePath) || '.',
    nested_level: nestedLevel,
    node_type: 'folder',
    parent_node_id: parentNodeId,
    // '.' for the scan root of a repo-scope run, matching scope_value.
    path: relativePath === '' ? '.' : relativePath,
    type_count: 0,
  });

  const entries = readdirSync(absolutePath, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
  );

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      folderNode.child_folder_count += 1;
      walkDirectory({
        absolutePath: join(absolutePath, entry.name),
        nestedLevel: nestedLevel + 1,
        parentNodeId: folderNode.node_id,
      });
      continue;
    }
    if (!entry.isFile()) continue;
    folderNode.child_file_count += 1;
    makeFileNode({
      absolutePath: join(absolutePath, entry.name),
      name: entry.name,
      nestedLevel: nestedLevel + 1,
      parentNodeId: folderNode.node_id,
    });
  }
};

const buildStats = () => {
  const fileNodes = nodes.filter((node) => node.node_type === 'file');
  // folder_count must be counted explicitly rather than `nodes.length -
  // fileNodes.length` — that subtraction only worked back when folder/file
  // were the only two node types; ADR-027's symbol nodes would otherwise
  // get miscounted as folders.
  const folderCount = nodes.filter(
    (node) => node.node_type === 'folder',
  ).length;
  return {
    analyzed_file_count: fileNodes.filter((node) => node.is_analyzed).length,
    file_count: fileNodes.length,
    folder_count: folderCount,
    max_depth: nodes.reduce((max, node) => Math.max(max, node.nested_level), 0),
    total_export_count: fileNodes.reduce((s, n) => s + n.export_count, 0),
    total_function_count: fileNodes.reduce((s, n) => s + n.function_count, 0),
    total_line_count: fileNodes.reduce((s, n) => s + (n.line_count ?? 0), 0),
    total_node_count: nodes.length,
    total_type_count: fileNodes.reduce((s, n) => s + n.type_count, 0),
  };
};

const renderAppGraphReportMarkdown = ({ report, stats }) => `# app-graph Report

## Metadata

- schema_version: 1.0
- report_id: ${report.report_id}
- generated_at: ${report.generated_at}
- skill_name: app-graph
- repository: ${context.isTargetMode ? context.gitRoot : relative(hostRoot, context.gitRoot) || '.'}
- scope_type: folder
- scope_value: ${context.scopeArgument}
- severity_scale: BLOCKER, HIGH, MEDIUM, LOW, NIT
- raw_artifact: app-graph.raw.json

## Summary

- files_analyzed: ${report.files_analyzed}
- findings_count_by_severity:
  - blocker: 0
  - high: 0
  - medium: 0
  - low: 0
  - nit: 0
- top_risk: ${report.top_risk}
- first_3_actions:
  1. No actions required — inventory scanner.
  2.
  3.

## Structure Inventory

| Metric | Value |
| --- | --- |
| Total nodes | ${stats.total_node_count} |
| Folders | ${stats.folder_count} |
| Files | ${stats.file_count} |
| Max depth | ${stats.max_depth} |
| Files analyzed by ts-morph | ${stats.analyzed_file_count} |
| Exports | ${stats.total_export_count} |
| Functions | ${stats.total_function_count} |
| Type declarations | ${stats.total_type_count} |
| Total lines | ${stats.total_line_count} |

## Findings

No findings — app-graph is an inventory scanner (0 findings by design).

## Prioritized Execution Queue

None — no findings.

## Deferred Items

None.

## Validation Checklist

- [x] Required sections present
- [x] Required metadata fields present
- [x] Summary counts match findings
- [x] Severity values are canonical
- [x] Node tree machine-generated directly from the filesystem walk

## Closure Criteria

- Not applicable — inventory scanner.
`;

const main = () => {
  const timestamp = makeTimestamp();
  const outputDirectory = resolveOutputDirectory(
    context,
    'app-graph',
    timestamp,
  );

  try {
    walkDirectory({
      absolutePath: context.scopeDirectory,
      nestedLevel: 0,
      parentNodeId: null,
    });
  } catch (error) {
    if (!context.isTargetMode) {
      console.error(`app-graph walk failed: ${error.message}`);
      process.exit(1);
    }
    toolFailures.push(`walk failed: ${error.message}`);
    nodes.length = 0;
  }

  const stats = buildStats();
  const generatedAt = new Date().toISOString();

  const rawArtifact = {
    generated_at: generatedAt,
    kind: 'app-graph',
    nodes,
    scan_root: context.scopeArgument,
    stats,
    tool: { name: 'ts-morph', version: tsMorphVersion ?? null },
    ...(toolFailures.length > 0 ? { errors: toolFailures } : {}),
  };

  const report = {
    blocker_count: 0,
    files_analyzed: stats.file_count,
    findings: [],
    generated_at: generatedAt,
    health_metrics: { app_graph: stats },
    high_count: 0,
    low_count: 0,
    medium_count: 0,
    nit_count: 0,
    report_id: `app-graph-${timestamp}`,
    top_risk:
      toolFailures.length > 0
        ? toolFailures.slice(0, 3).join(' ')
        : 'None — inventory scanner (0 findings by design).',
  };

  writeArtifacts({
    markdown: renderAppGraphReportMarkdown({ report, stats }),
    outputDirectory,
    rawArtifact,
    rawFileName: 'app-graph.raw.json',
    report,
  });

  console.log(`Run directory: ${outputDirectory}/`);
  console.log(
    `Nodes: ${stats.total_node_count} (${stats.folder_count} folders, ${stats.file_count} files, max depth ${stats.max_depth})`,
  );

  ingestScanArtifacts({
    context,
    outputDirectory,
    rawFileName: 'app-graph.raw.json',
    scannerId: 'app-graph',
  });
};

main();
