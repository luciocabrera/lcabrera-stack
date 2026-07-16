import path from 'node:path';

// `.env.<suffix>` variants that are documentation/templates by convention,
// never real credentials — the only carve-outs from the .env family.
const SAFE_ENV_SUFFIXES = new Set(['.example', '.sample', '.template']);

const SECRET_BASENAMES = new Set([
  '.dockercfg',
  '.envrc',
  '.git-credentials',
  '.netrc',
  '.npmrc',
  '.pgpass',
  'credentials',
  'credentials.json',
]);

const SECRET_EXTENSIONS = new Set(['.key', '.p12', '.pem', '.pfx']);

const SECRET_KEY_PREFIXES = ['id_dsa', 'id_ecdsa', 'id_ed25519', 'id_rsa'];

/**
 * Does this path point at a credential-bearing file an unattended scan
 * session must never read (ADR-020)? Purely name-based — the basename is
 * the signal, wherever the file lives (self-scan makes `docker/local/.env`
 * in the target repo a real DB credential). Matches the `.env` family
 * (except the template variants), SSH/TLS key material, and the classic
 * dotfile credential stores. Case-insensitive.
 */
export const isSecretFilePath = (candidatePath: string): boolean => {
  const name = path.basename(candidatePath.trim()).toLowerCase();
  if (name.length === 0) {
    return false;
  }

  if (name.startsWith('.env.')) {
    return !SAFE_ENV_SUFFIXES.has(name.slice('.env'.length));
  }
  if (name === '.env' || name.endsWith('.env')) {
    return true;
  }

  if (SECRET_BASENAMES.has(name)) {
    return true;
  }

  if (SECRET_KEY_PREFIXES.some((prefix) => name.startsWith(prefix))) {
    return true;
  }

  const dotIndex = name.lastIndexOf('.');
  const extension = dotIndex === -1 ? '' : name.slice(dotIndex);
  return SECRET_EXTENSIONS.has(extension);
};
