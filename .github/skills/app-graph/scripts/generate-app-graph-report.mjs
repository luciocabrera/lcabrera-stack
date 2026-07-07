#!/usr/bin/env node
// Deterministic app-graph scanner (ADR-022, Phase-3 Step 8). An INVENTORY,
// not an audit: walks the scan scope, builds the nested folder/file node
// tree (with per-file export/function/type counts via ts-morph) and emits
// app-graph.raw.json + a canonical 0-findings report.json + report.md.
// Honors the shared deterministic-runner flag contract
// (--target/--scope/--output-dir/--skip-ingest).
//
// ts-morph is resolved from THIS repo's node_modules (same technique as
// the fallow bin) — an arbitrary registered target needs no install. Files
// are parsed one at a time and forgotten immediately, so memory stays flat
// on large targets. The directory skip list mirrors
// buildFileInventory.util.ts so the node tree and the generic run_files
// inventory describe the same file set.

import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, relative } from 'node:path';

import {
  ingestIntoCqms,
  makeTimestamp,
  parseRunContext,
  repoRoot,
  resolveOutputDirectory,
  writeArtifacts,
} from '../../code-smell-shared/scripts/deterministic-scan-shared.mjs';

// Legacy positional default is the whole repo — the graph of a single app
// is a scoped run, not the default.
const context = parseRunContext('.');

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
      paths: [repoRoot],
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

const analyzeSourceText = (nodePath, text) => {
  if (!project) return { export_count: 0, function_count: 0, type_count: 0 };
  try {
    const sourceFile = project.createSourceFile(nodePath, text, {
      overwrite: true,
    });
    const counts = {
      export_count: countExports(sourceFile),
      function_count: countFunctions(sourceFile),
      type_count: countTypes(sourceFile),
    };
    sourceFile.forget();
    return { ...counts, is_analyzed: true };
  } catch (error) {
    toolFailures.push(`parse failed for ${nodePath}: ${error.message}`);
    return { export_count: 0, function_count: 0, type_count: 0 };
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

const makeFileNode = ({ absolutePath, name, nestedLevel, parentNodeId }) => {
  const extension = getExtension(name);
  let text;
  try {
    text = readFileSync(absolutePath, 'utf8');
  } catch {
    text = undefined;
  }

  const symbolCounts =
    text !== undefined && ANALYZABLE_EXTENSIONS.has(extension)
      ? analyzeSourceText(relative(context.gitRoot, absolutePath), text)
      : { export_count: 0, function_count: 0, type_count: 0 };

  return makeNode({
    child_file_count: 0,
    child_folder_count: 0,
    extension,
    line_count: text === undefined ? null : text.split('\n').length,
    name,
    nested_level: nestedLevel,
    node_type: 'file',
    parent_node_id: parentNodeId,
    path: relative(context.gitRoot, absolutePath),
    ...symbolCounts,
  });
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
  return {
    analyzed_file_count: fileNodes.filter((node) => node.is_analyzed).length,
    file_count: fileNodes.length,
    folder_count: nodes.length - fileNodes.length,
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
- repository: ${context.isTargetMode ? context.gitRoot : relative(repoRoot, context.gitRoot) || '.'}
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

  ingestIntoCqms({
    context,
    outputDirectory,
    rawFileName: 'app-graph.raw.json',
    scannerId: 'app-graph',
  });
};

main();
