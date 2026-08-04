import { describe, expect, it } from 'vite-plus/test';

import { DECLARABLE_STATUSES, diffAgainstRegister } from './suppressions.mjs';

// What this defends: the register is only worth having if every way an entry
// can go wrong FAILS. Each lane below started as a way a malformed, rotted or
// undeclared entry rode along in a green run — the detector tests are the
// sibling half, in suppressions.test.mjs.

describe('diffAgainstRegister', () => {
  const entry = {
    count: 1,
    key: 'inline packages/ui/a.ts no-console',
    reason: 'a reason long enough to count as an argument',
    ref: 'ADR-000',
  };
  const found = [{ count: 1, key: entry.key }];

  // The `acknowledged` lane's shape: a matched, documented, status-less entry
  // is clean on every condition, once the lane opts out of declaring one.
  it('passes when the tree matches the register', () => {
    const result = diffAgainstRegister({
      found,
      register: [entry],
      requireStatus: false,
    });
    expect(
      result.grew.concat(
        result.provisional,
        result.stale,
        result.unapproved,
        result.undeclared,
        result.undocumented,
      ),
    ).toHaveLength(0);
  });

  it('flags a suppression with no entry', () => {
    expect(
      diffAgainstRegister({ found, register: [] }).unapproved,
    ).toHaveLength(1);
  });

  it('flags an approved key that grew', () => {
    const result = diffAgainstRegister({
      found: [{ count: 2, key: entry.key }],
      register: [entry],
    });
    expect(result.grew[0].approvedCount).toBe(1);
  });

  // The anti-rot half. Without it an approval outlives the code that justified
  // it and silently pre-authorises whatever next occupies that key — which is
  // how every baseline in this repo started rotting.
  it('flags an entry whose code is gone', () => {
    expect(
      diffAgainstRegister({ found: [], register: [entry] }).stale,
    ).toHaveLength(1);
  });

  it('flags an entry approved for more than the tree holds', () => {
    expect(
      diffAgainstRegister({ found, register: [{ ...entry, count: 3 }] }).stale,
    ).toHaveLength(1);
  });

  it('rejects an entry with a token reason or no reference', () => {
    expect(
      diffAgainstRegister({ found, register: [{ ...entry, reason: 'needed' }] })
        .undocumented,
    ).toHaveLength(1);
    expect(
      diffAgainstRegister({ found, register: [{ ...entry, ref: '' }] })
        .undocumented,
    ).toHaveLength(1);
  });

  // A parked decision is otherwise a perfectly well-formed entry — matched,
  // documented, at the agreed count — so nothing else here would ever fire on
  // it, and it would sit in a green build until someone read a suffix.
  it('flags an otherwise-clean entry that is still provisional', () => {
    const result = diffAgainstRegister({
      found,
      register: [{ ...entry, status: 'provisional' }],
    });
    expect(result.provisional).toHaveLength(1);
    expect(
      result.grew.concat(result.stale, result.unapproved, result.undocumented),
    ).toHaveLength(0);
  });

  // `permanent` is the settled state; an acknowledged (repo-wide) entry carries
  // no status at all, and neither may be turned into a failure by this lane.
  it('leaves a permanent entry and a status-less one alone', () => {
    expect(
      diffAgainstRegister({
        found,
        register: [{ ...entry, status: 'permanent' }],
      }).provisional,
    ).toHaveLength(0);
    expect(
      diffAgainstRegister({ found, register: [entry] }).provisional,
    ).toHaveLength(0);
  });

  // The hole this lane closes: an entry with the field DELETED is matched,
  // documented and at the agreed count, and `provisional` keys off the value —
  // so every other condition passed it, and removing the line was a cheaper way
  // out than either discharge the register documents.
  it('flags an approved entry that declares no status', () => {
    const result = diffAgainstRegister({
      found,
      register: [entry],
      requireStatus: true,
    });
    expect(result.undeclared).toHaveLength(1);
    expect(result.undeclared[0].key).toBe(entry.key);
    expect(
      result.grew.concat(
        result.provisional,
        result.stale,
        result.unapproved,
        result.undocumented,
      ),
    ).toHaveLength(0);
  });

  // An unrecognised value has to fail as hard as a missing one — `"pending"`
  // reads like a declaration, belongs to no lane, and would otherwise sail
  // through exactly like a deleted field.
  it('accepts exactly the declarable statuses and nothing else', () => {
    const undeclaredFor = (status) =>
      diffAgainstRegister({
        found,
        register: [{ ...entry, status }],
        requireStatus: true,
      }).undeclared;
    expect(
      DECLARABLE_STATUSES.flatMap((status) => undeclaredFor(status)),
    ).toHaveLength(0);
    expect(undeclaredFor('pending')).toHaveLength(1);
  });

  // The default points at the strict side on purpose: a lane wired up without
  // the flag fails loudly instead of quietly skipping the check, which is the
  // exact shape of the bug this lane exists to remove.
  it('requires a status by default, so a forgotten flag fails loudly', () => {
    expect(
      diffAgainstRegister({ found, register: [entry] }).undeclared,
    ).toHaveLength(1);
  });

  // The asymmetry the fix must not leak into: `acknowledged` records repo-wide
  // policy (ADR-035 §7) that no public package chose, so those entries carry no
  // status by design and this lane never runs for them.
  it('leaves a status-less entry alone where no status is required', () => {
    expect(
      diffAgainstRegister({ found, register: [entry], requireStatus: false })
        .undeclared,
    ).toHaveLength(0);
  });
});
