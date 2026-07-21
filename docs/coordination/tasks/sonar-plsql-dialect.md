---
id: sonar-plsql-dialect
title: Stop Sonar analysing PostgreSQL .sql as Oracle PL/SQL
owner: agent:claude
status: review
branch: sonar-plsql-dialect
area:
  - .sonarcloud.properties
  - AGENTS.md
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #75
---

## What

Stop Sonar analysing PostgreSQL .sql as Oracle PL/SQL

## Status / next

- Current step: in review — PR open, gate green
- Blockers: none
- Note: `.sonarcloud.properties` is read from the DEFAULT BRANCH only, so this
  cannot be demonstrated working on the PR — verification is post-merge.
- Next: after merge, confirm no plsql findings on a migration-touching PR
