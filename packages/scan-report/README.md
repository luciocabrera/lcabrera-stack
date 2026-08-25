# @repo/scan-report

Deterministic code-quality scanners that all emit **one** report shape. Point
one at a directory and it writes three files: the tool's verbatim output, a
machine-readable `report.json`, and a human-readable `report.md`.

- **[SCHEMA_V1.md](SCHEMA_V1.md)** — the canonical report contract
- **[REPORT_JSON_CONTRACT.md](REPORT_JSON_CONTRACT.md)** — the `report.json` shape a consumer parses

**Private, and staying that way** — though not for the reason
[ADR-069's amendment](../../docs/decisions/ADR-069-publish-the-shared-toolchain.md#amendment-2026-08-14--scan-report-does-not-publish)
gave. That amendment withdrew the planned `@lcabrera/scan-report` publish on the
grounds that every consumer was CQMS and would leave with it. CQMS left in #683;
this package did not, because the consumers that matter were in this repository
all along: the `app-graph` skill imports `deterministic-scan` directly, and
`linter-checker`, `fallow-code-checker`, `code-smell-checker` and
`code-smell-zen` execute the runners and the `scan-report-ingest` bin. The
conclusion survived its own reasoning — it stays `@repo/*` and `private: true`
because the report shape it versions is per-repository, not because it is
going anywhere.

Nothing below assumes a registry; it works the same in whichever repository the
workspace lives.

## Requirements

`oxlint`, `eslint` and `fallow` are resolved from the repository being worked
in, and each scanner degrades to a clean 0-findings report when its tool or
config is absent — so nothing here forces you to have all three.
`scan-report-fallow` without fallow still writes all three artifacts and says
`No fallow installation found under <root>` in `top_risk`.

`scan-report-fallow` additionally expects a repo-root `.fallowrc.json`, and
`run-fallow.sh` — the interactive two-pass helper — expects `vp` (Vite+) on
PATH. The three `scan-report-*` scanners themselves need neither.

## Run

| Command              | Scans with                                                  |
| -------------------- | ----------------------------------------------------------- |
| `scan-report-oxlint` | oxlint (via `vp lint`, or `npx oxlint` on a target)         |
| `scan-report-eslint` | the flat-config eslint pass                                 |
| `scan-report-fallow` | the fallow CLI                                              |
| `scan-report-ingest` | nothing — forwards a finished run to your ingestion command |

Every scanner takes the same flags:

| Flag                         | Meaning                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `<scope>` or `--scope=<rel>` | subdirectory to scan, relative to the repository (default `.`)                     |
| `--target=<abs>`             | scan an arbitrary project outside this repository, which needs none of its tooling |
| `--output-dir=<dir>`         | where the three artifacts land (default `<repo>/.tmp/<scanner>/<timestamp>/`)      |
| `--skip-ingest`              | write the artifacts and stop                                                       |

```bash
node packages/scan-report/scripts/generate-oxlint-report.mjs packages/ui
node packages/scan-report/scripts/generate-fallow-report.mjs --target=/srv/checkouts/some-app --scope=.
```

Each is also a `bin`, so `node_modules/.bin/scan-report-oxlint` works from any
workspace that depends on this one.

## Persisting a run

The package stores nothing itself. To persist, configure a command in
`scan-report.config.json` at your repository root:

```jsonc
{
  "ingest": {
    "command": "node",
    "args": ["./tools/ingest.mjs"],
    // Loaded and merged into the command's environment; a variable already in
    // the environment wins, matching node's own --env-file.
    "envFiles": ["docker/local/.env"],
    // Working directory for the command, relative to the repository root.
    "cwd": ".",
  },
}
```

or with environment variables, which take precedence over the file:

| Variable                       | Meaning                                             |
| ------------------------------ | --------------------------------------------------- |
| `SCAN_REPORT_INGEST_COMMAND`   | the executable                                      |
| `SCAN_REPORT_INGEST_ARGS`      | leading arguments — comma-separated or a JSON array |
| `SCAN_REPORT_INGEST_ENV_FILES` | comma-separated env files                           |
| `SCAN_REPORT_INGEST_CWD`       | working directory                                   |
| `SCAN_REPORT_CONFIG`           | an alternative path to the config file              |
| `SCAN_REPORT_HOST_ROOT`        | override the detected repository root               |
| `SCAN_REPORT_GIT_BINARY`       | absolute path to git, when it is somewhere unusual  |

The command is invoked with the configured arguments followed by
`--skill=<scanner> --run-dir=<dir> --local-path=<git root> --scope-type=folder
--scope-value=<scope> --raw-json=<file>`.

**Configure nothing and nothing breaks.** Each run says
`Ingestion skipped: no ingestion command is configured …` and exits 0. A
_configured_ command that fails is the opposite: it prints `Ingestion FAILED`
and exits non-zero, because a persistence path that used to work and stopped is
not a normal state. The report artifacts are written and complete in both cases.

## Finding git

Every finding's `location_path` is relative to the scanned project's repository
root, which means running `git`. It is looked up by absolute path in a fixed,
per-platform list of directories rather than through `PATH` — on POSIX
`/usr/bin`, `/usr/local/bin`, `/bin`, Homebrew on both architectures, Nix
system and per-user profiles, MacPorts and Xcode's command line tools; on
Windows the Git-for-Windows install locations. If your host keeps git
elsewhere, set `SCAN_REPORT_GIT_BINARY` to its absolute path; a scan that
cannot find git says so on stderr and falls back to paths relative to the
scanned directory.

## Programmatic use

`@repo/scan-report/finding-templates` and
`@repo/scan-report/deterministic-scan` expose the per-rule fix wording and
`makeFindingId`, so a downstream consumer can re-derive the same finding
identities from a raw artifact instead of copying the strings.
