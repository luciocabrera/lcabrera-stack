/*
 * Whether the consumer's installed gate runtime can run the file about to be
 * written into their tree.
 *
 * Why: a shipped skill's prose invokes bins that live in a peer package, and
 * prose and bins skew — a consumer can upgrade the runtime, or never install it,
 * without ever re-running `sync` (ADR-081). Neither existing gate can see that:
 * both answer questions about `devkit.config.json`, and a version range is not a
 * config key. Unchecked, the file lands and fails at the moment an agent follows
 * it.
 *
 * The peer is OPTIONAL, so absence is a normal state and not an error: a
 * consumer who wants the prose and none of the gates simply does not install it.
 * That is why resolution answers `undefined` rather than throwing, and why the
 * range check takes the version as an argument — the decision stays pure and
 * testable with nothing on disk behind it, and the single effectful function is
 * a thin shell over the module resolver.
 *
 * Ranges are evaluated by `semver`, not by hand. A hand-rolled comparator in a
 * COMPATIBILITY gate fails the same silent way this gate exists to prevent, and
 * `^`/`>=`/`<` precedence is exactly what is wrong without looking wrong.
 */

import { createRequire } from 'node:module';

import { satisfies } from 'semver';

import { requiredPeers } from './frontmatter.mjs';

export const PEER_OK = 'ok';
export const PEER_OUT_OF_RANGE = 'out-of-range';
export const PEER_NOT_INSTALLED = 'not-installed';

/**
 * The default way a peer's manifest is read: the module resolver, the only thing
 * that knows a consumer's layout.
 *
 * A package whose `exports` do not expose `./package.json` throws here and so
 * reads as absent. That is the safe direction for a gate — a version it cannot
 * establish is a version it cannot vouch for — and it is why every peer named in
 * a `peer:` declaration must be one that exposes its manifest.
 */
const requirePeerManifest = ({ from, packageName }) =>
  createRequire(from)(`${packageName}/package.json`);

/**
 * The installed version of a peer, or `undefined` when it is not there.
 *
 * Never throws. The read is injected so the tolerance itself is testable without
 * a filesystem — the same choice `closure` made with its existence check, and
 * the reason a stubbed failure here proves what a missing package would do.
 *
 * @param {{ from: string, packageName: string,
 *   readManifest?: (args: { from: string, packageName: string }) => unknown }} args
 */
export const installedPeerVersion = ({
  from,
  packageName,
  readManifest = requirePeerManifest,
}) => {
  try {
    const version = readManifest({ from, packageName })?.version;
    return typeof version === 'string' && version !== '' ? version : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Whether an installed version answers a declared range. Pure: the version
 * arrives as a string, so nothing here reads a tree.
 *
 * An unparseable range reads as out of range rather than as satisfied, which is
 * `semver`'s own behaviour and the direction a gate has to fail in. Prereleases
 * are excluded unless the range names one — the same reading a package manager
 * gives the same range, so the answer here matches what the consumer's install
 * would have said.
 *
 * @param {{ installedVersion: string | undefined, range: string }} args
 */
export const checkPeerVersion = ({ installedVersion, range }) => {
  if (typeof installedVersion !== 'string' || installedVersion === '') {
    return PEER_NOT_INSTALLED;
  }
  return satisfies(installedVersion, range) ? PEER_OK : PEER_OUT_OF_RANGE;
};

/** What the consumer has to act on: which package, which range, and what is there. */
const describeUnmet = ({ installedVersion, peer, status }) =>
  `${peer.name}@${peer.range} (${
    status === PEER_NOT_INSTALLED
      ? 'not installed'
      : `installed ${installedVersion}`
  })`;

/**
 * The declared peers this tree cannot satisfy, each described the way the
 * refusal has to be read. Absent and out-of-range are one outcome — the file is
 * not written — and differ only in the wording, because the consumer's next move
 * is `install` in one case and `update` in the other.
 *
 * @param {{ peers: { name: string, range: string }[],
 *   versions?: Map<string, string | undefined> }} args
 */
export const unmetPeers = ({ peers, versions = new Map() }) =>
  peers
    .map((peer) => {
      const installedVersion = versions.get(peer.name);
      return {
        installedVersion,
        peer,
        status: checkPeerVersion({ installedVersion, range: peer.range }),
      };
    })
    .filter(({ status }) => status !== PEER_OK)
    .map(describeUnmet);

/**
 * Every distinct peer named across a set of assets. What makes "resolve once per
 * plan" possible: the caller resolves this list, not one name per asset, so a
 * peer named by twenty files is looked up once and `sync` and `doctor` cannot
 * see two different answers for it.
 */
export const declaredPeerNames = (assets) => [
  ...new Set(
    assets.flatMap((asset) =>
      requiredPeers(asset.content).map((peer) => peer.name),
    ),
  ),
];
