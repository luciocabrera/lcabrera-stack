/**
 * Directory names never descended into when walking a project tree — VCS
 * metadata, dependency installs, and build/tool output. Shared by
 * buildFileInventory (scan file listing) and packProjectArchive (the CLI push
 * packer, ADR-029) so the two can never drift on what counts as source, and
 * so a push never uploads hundreds of MB of node_modules.
 */
export const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.react-router',
  '.tmp',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);
