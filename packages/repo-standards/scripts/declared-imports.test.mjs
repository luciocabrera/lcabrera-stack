/**
 * Every bare import in this package is declared in its own manifest.
 *
 * Why this cannot be left to observation: inside this monorepo Node resolves a
 * bare specifier by walking up from the module, so an undeclared import finds
 * the repository root's `node_modules` and every gate here passes. Installed as
 * `node_modules/<name>/scripts/`, the same walk reaches the consumer's own
 * `node_modules` instead, which under pnpm's layout does not carry a dependency
 * nobody declared. The failure is invisible exactly where it is introduced and
 * only appears in someone else's repository — `ts-morph` was undeclared from the
 * moment the surface gate moved here until a reviewer read the import.
 *
 * The split matters as much as the presence: a module a consumer runs may only
 * use `dependencies`, since `devDependencies` are not installed for them. Test
 * files may use either, because they never ship.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(
  readFileSync(join(SCRIPTS, '..', 'package.json'), 'utf8'),
);

/**
 * A static import or re-export, anchored to the start of its line — including
 * the `} from '…'` that closes a multi-line one.
 *
 * Anchored, and requiring the `from` keyword, because looser drafts matched
 * `Buffer.from('one ')` in a test fixture and then `export const X = '…'` in
 * half the modules. Nothing here imports dynamically, so there is no second
 * form to cover; if that changes, this stops seeing it, which is what the
 * self-check below is for.
 */
const SPECIFIER =
  /^\s*(?:(?:import|export)[^'\n]*\bfrom\s*'|import\s*'|\}\s*from\s*')([^']+)'/gm;

/** `@scope/name/sub` → `@scope/name`; `name/sub` → `name`. */
const packageOf = (specifier) => {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

const isBare = (specifier) =>
  !specifier.startsWith('.') && !specifier.startsWith('node:');

const importedPackages = (file) => {
  const source = readFileSync(join(SCRIPTS, file), 'utf8');
  const found = new Set();
  for (const [, specifier] of source.matchAll(SPECIFIER)) {
    if (isBare(specifier)) found.add(packageOf(specifier));
  }
  return [...found];
};

const modules = readdirSync(SCRIPTS).filter((name) => name.endsWith('.mjs'));
const runtimeModules = modules.filter((name) => !name.endsWith('.test.mjs'));

describe('declared imports', () => {
  // Guards the guard: a matcher that found nothing would pass both assertions
  // below while proving nothing. Named specifiers, not a count, so a regex that
  // silently stops matching one shape fails here rather than reporting clean.
  it('finds the imports it is meant to check', () => {
    expect(importedPackages('api-surface-extract.mjs')).toContain('ts-morph');
    expect(importedPackages('publish-pack.mjs')).toContain(
      '@arethetypeswrong/core',
    );
    expect(importedPackages('cli-input.test.mjs')).toContain('vite-plus');
  });

  // The same fixture that defeated the first matcher: a bare `from '…'` that is
  // not an import at all.
  it('does not mistake a method call for an import', () => {
    expect(importedPackages('cli-input.test.mjs')).not.toContain('one ');
  });

  it('declares every package a consumer would need at runtime', () => {
    const declared = new Set(Object.keys(MANIFEST.dependencies ?? {}));
    const undeclared = runtimeModules.flatMap((file) =>
      importedPackages(file)
        .filter((name) => !declared.has(name))
        .map((name) => `${file} imports ${name}`),
    );

    expect(undeclared).toEqual([]);
  });

  it('lets test files reach devDependencies, and nothing else', () => {
    const declared = new Set([
      ...Object.keys(MANIFEST.dependencies ?? {}),
      ...Object.keys(MANIFEST.devDependencies ?? {}),
    ]);
    const undeclared = modules.flatMap((file) =>
      importedPackages(file)
        .filter((name) => !declared.has(name))
        .map((name) => `${file} imports ${name}`),
    );

    expect(undeclared).toEqual([]);
  });
});
