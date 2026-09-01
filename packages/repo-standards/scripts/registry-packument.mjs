/**
 * The npm registry read shared by the release scripts.
 *
 * Extracted from `release-publish-plan.mjs` once `audit-release.mjs` needed the
 * same lookup. Two clients would mean two sets of failure semantics, and the
 * semantics are the load-bearing part: a **404 is an answer** (it is how "never
 * published" presents), while any other failure — an outage, a proxy, an
 * unroutable host — rethrows. An unreachable registry must never read as
 * "nothing is published" or "nothing is wrong"; a supply-chain check that goes
 * green because it could not run is worse than none, because it is believed.
 *
 * Queried over HTTPS rather than by shelling out to `npm view`: spawning `npm`
 * resolves a bare command name through `PATH`, which is a real concern in a job
 * holding an OIDC token with publish rights (Sonar S4036), and this is one
 * request per package with no dependency on the CLI's output format.
 *
 * `encodeURIComponent` rather than replacing the scope separator: a name is a
 * whole path segment, and escaping one character by hand leaves every other one
 * — including a second `/` — to fall through into the URL.
 */

const REGISTRY =
  process.env.npm_config_registry ?? 'https://registry.npmjs.org';

const ABBREVIATED_ACCEPT = 'application/vnd.npm.install-v1+json';

const FULL_ACCEPT = 'application/json';

export const registryUrl = (name) => `${REGISTRY}/${encodeURIComponent(name)}`;

export const registryOrigin = () => REGISTRY;

export const fetchPackument = async (
  name,
  { fetchImpl = fetch, full = false } = {},
) => {
  const response = await fetchImpl(registryUrl(name), {
    headers: { accept: full ? FULL_ACCEPT : ABBREVIATED_ACCEPT },
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(
      `registry lookup for ${name} failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
};
