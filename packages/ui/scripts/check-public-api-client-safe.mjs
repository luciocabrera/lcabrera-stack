import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uiRootDir = resolve(__dirname, '..');
const publicApiFilePath = resolve(uiRootDir, 'src/public-api.ts');

const importExportPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?['"]([^'"\n]+)['"]/g;

const resolveLocalModuleFilePath = (fromFilePath, source) => {
  const basePath = resolve(dirname(fromFilePath), source);
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    resolve(basePath, 'index.ts'),
    resolve(basePath, 'index.tsx'),
    resolve(basePath, 'index.js'),
    resolve(basePath, 'index.mjs'),
  ];

  return (
    candidates.find(
      (candidatePath) =>
        existsSync(candidatePath) && statSync(candidatePath).isFile(),
    ) ?? null
  );
};

const collectStaticDependencies = (filePath, seen = new Set()) => {
  if (seen.has(filePath)) {
    return [];
  }

  seen.add(filePath);

  const fileText = readFileSync(filePath, 'utf8');
  const dependencies = [];

  let match;
  while ((match = importExportPattern.exec(fileText)) !== null) {
    const source = match[1];
    dependencies.push({ filePath, source });

    if (!source.startsWith('.')) {
      continue;
    }

    const dependencyPath = resolveLocalModuleFilePath(filePath, source);
    if (dependencyPath === null) {
      continue;
    }

    dependencies.push(...collectStaticDependencies(dependencyPath, seen));
  }

  return dependencies;
};

const main = () => {
  const allDependencies = collectStaticDependencies(publicApiFilePath);

  const serverOnlyReferences = allDependencies.filter(({ source }) =>
    source.startsWith('node:'),
  );

  if (serverOnlyReferences.length === 0) {
    console.log(
      'PASS: public API graph contains no server-only node:* imports.',
    );
    return;
  }

  const failureLines = serverOnlyReferences.map(
    ({ filePath, source }) => `- ${filePath} imports ${source}`,
  );

  console.error(
    'FAIL: packages/ui/src/public-api.ts leaks server-only dependencies.',
  );
  console.error(
    'Remove SSR-only exports from the root barrel and use @repo/ui/server.',
  );
  console.error(failureLines.join('\n'));
  process.exitCode = 1;
};

main();
