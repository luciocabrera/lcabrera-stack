import type { StatusBadgeTone } from '@repo/ui/components/StatusBadge';

/**
 * Maps a `cqms.runs`/`cqms.scans` status string to a `StatusBadge` tone.
 * `StatusBadge` itself has no opinion on what a status means (see its own
 * ARCHITECTURE.md) — this is that domain-specific mapping, kept local to
 * CQMS rather than baked into the shared component.
 */
export const resolveRunStatusTone = (
  status: null | string,
): StatusBadgeTone => {
  switch (status) {
    case 'failed': {
      return 'error';
    }
    case 'partially_failed': {
      return 'warning';
    }
    case 'running': {
      return 'info';
    }
    case 'succeeded': {
      return 'success';
    }
    default: {
      return 'neutral';
    }
  }
};
