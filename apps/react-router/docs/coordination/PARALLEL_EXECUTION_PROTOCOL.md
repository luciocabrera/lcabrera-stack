# Parallel Execution Protocol (Safe Multi-Agent)

This protocol allows multiple agents to work in parallel with low merge risk.

## 1) Scope Partitioning

Assign each agent one workstream with isolated file ownership.

- Agent A: test-only dedupe clusters
- Agent B: constants/config dedupe clusters
- Agent C: docs/architecture updates only

Never assign two agents overlapping files in the same batch.

## 2) Lock Before Work

Before editing, claim a lock in `WORKSTREAM_LOCKS.md`.

Required lock fields:

- Workstream ID
- Agent name
- Target files
- Start time
- Expected validation commands

## 3) Small Batch Strategy

Each agent should:

1. Touch one cluster only.
2. Keep public APIs unchanged unless explicitly planned.
3. Run focused validation immediately.
4. Produce a short handoff note using `AGENT_HANDOFF_TEMPLATE.md`.

## 4) Validation Contract

Minimum per agent:

- Targeted tests for changed area
- `vp check`
- Optional: `npx -y fallow dupes --mode semantic | head -40` to verify reduction trend

## 5) Merge Order

Merge low-risk foundational changes first:

1. Shared test utilities
2. Test-file dedupe
3. Constants dedupe
4. Runtime logic dedupe
5. Styling/theme dedupe

## 6) Conflict Rules

If lock overlap occurs:

- First lock keeps ownership.
- Second agent must switch workstream.
- No force pushes to resolve overlap.

## 7) Safety Stop Conditions

Stop and escalate if:

- `vp check` fails with unrelated widespread errors
- Duplicate reduction requires behavior-affecting refactor in critical runtime paths
- A second cluster becomes coupled to current cluster unexpectedly
