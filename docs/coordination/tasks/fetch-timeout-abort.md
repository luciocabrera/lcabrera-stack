---
id: fetch-timeout-abort
title: Add opt-in timeout and AbortSignal support to fetchAndValidate
owner: agent:claude
status: active
branch: feat/fetch-timeout-abort
area:
  - packages/api/src/http/**
  - packages/api/src/distinct/**
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #148
---

## What

`fetchAndValidate` is the single fetch path behind every service call in the
repo and has no timeout and no cancellation, so a hung endpoint hangs the
caller and nothing can abort an in-flight request.

Adds optional `signal` and `timeoutMs`. **No default timeout** — a default
would change behaviour for every existing caller at once, and the right ceiling
differs between an SSR loader and a browser call. Callers opt in; the sites that
demonstrably need it get wired.

## Status / next

- Current step: done — primitive, `fetchDistinctValues` passthrough, and the
  filter-options loader forwarding `request.signal`
- Blockers: none
- Next: client-side Table paging cancellation is deliberately NOT here. It needs
  the public `onLoadMore` contract to carry a signal, which reaches both store
  contexts and ~51 call sites, plus abort-error handling inside the store —
  a store-pattern change, filed separately
