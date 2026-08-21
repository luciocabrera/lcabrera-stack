#!/usr/bin/env node

/**
 * Audits the manifests that actually shipped, against the registry.
 *
 * `repo-verify-publish` checks the tarball the source tree *would* produce and
 * packs with pnpm, because the `publishConfig.exports` swap is a pnpm extension
 * (ADR-073). So a defect present only in an `npm pack` tarball is invisible to
 * it permanently — which is how a package once reached npm uninstallable with
 * every gate in its repository green (#730). This sits beside it and asks the
 * other question: is what a consumer can install still the shape the repository
 * intends?
 *
 * **It observes drift; it cannot prevent it.** A hand-publish from a laptop
 * reaches the registry without passing anything here, and an npm version is
 * immutable, so a finding is fixed by superseding and deprecating, never by
 * repairing. The decisions on version coverage and on why this reports rather
 * than blocking a pull request are ADR-077.
 *
 * Usage (from the repository root):
 *   repo-audit-release                     # every published version
 *   repo-audit-release <name>              # one package
 *   repo-audit-release <name>@<version>    # one version
 *
 * Exit codes: 0 = every published manifest is loadable and installable, 1 = one
 * is not, a named spec could not be resolved, the registry could not be
 * reached, or the run resolved no packument at all — a registry answering 404
 * to everything must not read as "audited everything, all clean" (every finding
 * is listed, not just the first).
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorMessage } from './error-message.mjs';
import { isBuiltPublicPackage } from './publish-surface.mjs';
import { readPublishableManifests } from './publishable-workspaces.mjs';
import {
  auditPackument,
  readNothing,
  renderAudit,
  resolvedNothing,
  selectBroken,
} from './release-audit.mjs';
import { fetchPackument, registryOrigin } from './registry-packument.mjs';
import { resolveHostRoot } from './host-root.mjs';

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});

/**
 * Every workspace that can reach the registry, with the one classification the
 * audit needs. `isBuiltPublicPackage` is `repo-verify-publish`'s own predicate:
 * a package that does not build ships source deliberately, and for it a `./src/`
 * export target is the intended surface rather than a defect.
 */
const readWorkspaceTargets = () =>
  readPublishableManifests(REPO_ROOT).map((manifest) => ({
    name: manifest.name,
    shipsSource: !isBuiltPublicPackage(manifest),
  }));

/** `@scope/name@1.2.3` — the last `@` wins, so a scoped name stays intact. */
const parseSpec = (spec) => {
  const separator = spec.lastIndexOf('@');

  return separator > 0
    ? { name: spec.slice(0, separator), only: spec.slice(separator + 1) }
    : { name: spec, only: undefined };
};

const describeSpec = ({ name, only }) =>
  only === undefined ? name : `${name}@${only}`;

/**
 * A name given on the command line need not be a workspace here — a renamed or
 * withdrawn package is exactly what someone would point this at. Unknown names
 * are audited strictly (source exports are a defect), which is the safe
 * direction to guess in.
 */
const toTargets = (specs) => {
  const workspaces = readWorkspaceTargets();

  if (specs.length === 0) {
    return workspaces.map((target) => ({ ...target, explicit: false }));
  }

  const shipsSource = new Map(
    workspaces.map(({ name, shipsSource: ships }) => [name, ships]),
  );

  return specs.map((spec) => {
    const { name, only } = parseSpec(spec);

    return {
      explicit: true,
      name,
      only,
      shipsSource: shipsSource.get(name) ?? false,
    };
  });
};

const auditTarget = async ({ explicit, name, only, shipsSource }) => {
  const packument = await fetchPackument(name, { full: true });

  return {
    explicit,
    name,
    only,
    published: packument !== undefined,
    versions:
      packument === undefined
        ? []
        : auditPackument({ only, packument, shipsSource }),
  };
};

/**
 * A named spec that resolved to nothing is a failure, never a quiet pass: the
 * caller asked about a specific artifact and got no answer, which is the shape
 * of a check that reports success having established nothing.
 */
const selectUnresolved = (audited) =>
  audited
    .filter(({ explicit, versions }) => explicit && versions.length === 0)
    .map(describeSpec);

const REMEDIATION = [
  '',
  'An npm version is immutable: a broken one is fixed by publishing a corrected',
  'version and `npm deprecate`-ing the old one, which this audit then reports',
  'without failing. See ADR-077.',
];

const LIMITATION =
  'This reads the registry after the fact. It cannot stop a hand-publish, and a green run is not a claim that the registry cannot drift.';

const report = ({ audited, blind, broken, unresolved }) => {
  console.log(renderAudit({ audited, registry: registryOrigin() }));

  for (const spec of unresolved) {
    console.error(`✗ ${spec} could not be resolved on the registry.`);
  }

  if (blind) {
    console.error(
      readNothing({
        named: audited.some(({ explicit }) => explicit),
        registry: registryOrigin(),
      }),
    );
  }

  if (broken.length > 0) {
    console.error('Published manifests a consumer cannot use:');

    for (const spec of broken) {
      console.error(`  ✗ ${spec}`);
    }

    console.error(REMEDIATION.join('\n'));
  }

  console.log(LIMITATION);
};

const main = async () => {
  const specs = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  const audited = await Promise.all(toTargets(specs).map(auditTarget));
  const blind = resolvedNothing(audited);
  const broken = selectBroken(audited);
  const unresolved = selectUnresolved(audited);

  report({ audited, blind, broken, unresolved });

  if (blind || broken.length > 0 || unresolved.length > 0) {
    process.exitCode = 1;
  }
};

try {
  await main();
} catch (error) {
  // An unreachable registry fails. It must never read as "nothing is wrong":
  // a supply-chain check that goes green because it could not run is worse
  // than none, because it is believed.
  console.error(
    `✗ The published-manifest audit could not run: ${errorMessage(error)}`,
  );
  process.exitCode = 1;
}
