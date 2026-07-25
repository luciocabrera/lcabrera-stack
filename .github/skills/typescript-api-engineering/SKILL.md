---
name: typescript-api-engineering
description: |
  This skill defines the engineering standards that every AI agent MUST follow when designing, implementing, modifying, or reviewing TypeScript APIs.
  It is framework-agnostic and applies to Express, Fastify, NestJS, Hono, Elysia, tRPC (where applicable), and any Node.js TypeScript backend.
  The primary goals are:
  - API-first development
  - Strong typing
  - Runtime validation
  - Security by default
  - Excellent developer experience
  - AI-friendly APIs
  - Long-term maintainability
user-invocable: true
paths: ['**/routes/api/**']
---

# Core Philosophy

Every API is a contract.

The contract is more important than the implementation.

Every endpoint must be:

- Predictable
- Consistent
- Fully typed
- Runtime validated
- Secure
- Observable
- Well documented
- Backward compatible

The API should be understandable by:

- Humans
- Frontend developers
- Backend developers
- SDK generators
- AI Agents
- Automation tools

---

# Engineering Principles

## 1. API First

Always design the API contract before writing implementation.

Required deliverables:

- OpenAPI specification
- Request schemas
- Response schemas
- Error schemas
- Authentication requirements
- Examples

Never implement undocumented endpoints.

---

## 2. Consistency Over Cleverness

Consistency is more valuable than innovation.

Every endpoint should follow identical conventions.

Avoid creating one-off patterns.

If two endpoints solve similar problems, they should look nearly identical.

---

## 3. Strong Typing Everywhere

TypeScript should operate in strict mode.

Never use:

- any
- implicit any
- unsafe casts
- unknown leaking into business logic

Prefer:

- inferred types
- readonly where appropriate
- discriminated unions
- enums only when appropriate
- literal types

Types should be inferred from runtime validation schemas whenever possible.

---

# Resource Design

## Resources Use Nouns

Correct

```
/users
/users/{id}
/orders
/products
```

Incorrect

```
/getUsers
/createOrder
/deleteProduct
```

---

## Use Plural Resources

Good

```
/users
/orders
/products
```

Avoid

```
/user
/order
/product
```

---

## Keep URLs Shallow

Good

```
/users/{id}
/users/{id}/orders
```

Avoid

```
/companies/{id}/departments/{id}/employees/{id}/orders
```

---

## Predictable Resource Names

Always use lowercase.

Use hyphens when needed.

Avoid underscores.

---

# HTTP Methods

| Method | Purpose        |
| ------ | -------------- |
| GET    | Read           |
| POST   | Create         |
| PUT    | Replace        |
| PATCH  | Partial Update |
| DELETE | Delete         |

Never misuse HTTP methods.

---

# HTTP Status Codes

Use proper status codes.

Common examples:

200 OK

201 Created

202 Accepted

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Unprocessable Entity

429 Too Many Requests

500 Internal Server Error

Never return HTTP 200 for failures.

---

# Request Validation

Every external input MUST be validated.

Including:

- Path parameters
- Query parameters
- Request body
- Headers
- Cookies

Never trust client input.

Preferred validators:

- Zod
- Valibot
- TypeBox

TypeScript alone is NOT validation.

---

# Response Validation

Responses should also be validated before returning.

This prevents accidental contract drift.

---

# Request Models

Separate:

- Create DTO
- Update DTO
- Response DTO

Do not reuse the same object for everything.

---

# Response Design

Responses should be predictable.

Example

```json
{
  "data": {},
  "meta": {},
  "links": {}
}
```

Errors

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "details": []
  }
}
```

Never expose internal exceptions.

---

# Error Handling

Errors should be centralized.

Avoid

```ts
throw new Error(...)
```

inside controllers.

Instead:

```
Domain Error

↓

Application Error

↓

HTTP Error

↓

Serialized JSON
```

Every error should include:

- machine-readable code
- human-readable message
- optional details

---

# Authentication

Authentication should be middleware.

Supported mechanisms:

- JWT
- OAuth
- API Keys
- Session Authentication

Controllers should assume authenticated users.

---

# Authorization

Authorization belongs to policies.

Avoid:

```ts
if (user.admin)
```

inside controllers.

Instead:

```
Policy

↓

Permission Check

↓

Business Logic
```

---

# Pagination

Prefer cursor pagination.

Return:

```json
{
  "data": [],
  "meta": {
    "nextCursor": "...",
    "previousCursor": "...",
    "hasMore": true
  }
}
```

Avoid offset pagination for mutable datasets.

---

# Filtering

Prefer predictable query syntax.

Examples

```
?status=active

?limit=20

?cursor=abc

?sort=-createdAt
```

---

# Sorting

Sorting should always be explicit.

Example

```
sort=name

sort=-createdAt
```

Negative means descending.

---

# Searching

Use dedicated search parameters.

Example

```
?q=john

?query=john
```

Do not overload filtering parameters.

---

# Versioning

Breaking changes require versioning.

Preferred:

```
/v1

/v2
```

Alternative:

Media type versioning.

Never silently break clients.

---

# Idempotency

Required for:

- Payments
- Imports
- Job execution
- Long-running tasks

Support

```
Idempotency-Key
```

where appropriate.

---

# Security

Every API must include:

- HTTPS
- Input validation
- Output encoding
- Rate limiting
- Authentication
- Authorization
- Secret management
- Secure headers
- CORS configuration

Prevent:

- SQL Injection
- XSS
- CSRF
- SSRF
- Command Injection

Never expose stack traces.

---

# OpenAPI Requirements

Every endpoint MUST define:

- summary
- description
- operationId
- tags
- parameters
- requestBody
- responses
- examples
- authentication
- error responses

Descriptions should clearly explain business intent.

---

# AI Agent Compatibility

APIs should be easily consumable by AI Agents.

Every operation should have:

Clear operationId

Good summary

Detailed description

Request examples

Response examples

Consistent naming

Stable schemas

Machine-readable errors

Avoid ambiguous endpoint names.

Good

```
createUser
```

Better

```
createOrganizationUser
```

---

# Logging

Every request should produce:

- request id
- correlation id
- timestamp
- route
- duration
- status
- authenticated user
- errors

Prefer structured logging.

---

# Metrics

Collect:

- request duration
- error rate
- request count
- endpoint latency
- database latency

Expose Prometheus metrics where applicable.

---

# Tracing

Support distributed tracing.

Include:

- trace id
- span id

Forward tracing headers.

---

# Testing

Every endpoint requires:

Unit Tests

Integration Tests

Contract Tests

OpenAPI Validation

Authentication Tests

Authorization Tests

Error Tests

Pagination Tests

Performance Tests where applicable

---

# Performance

Avoid:

N+1 queries

Repeated database lookups

Large payloads

Blocking operations

Prefer:

Caching

Streaming

Compression

Async processing

---

# Documentation

Every endpoint requires:

Purpose

Authentication

Parameters

Responses

Errors

Examples

Rate limits

Deprecation notes

---

# Backward Compatibility

Adding fields:

Safe

Removing fields:

Breaking

Renaming fields:

Breaking

Changing data types:

Breaking

Never introduce breaking changes without versioning.

---

# Code Quality

Controllers should remain thin.

Business logic belongs in services.

Repositories should only access persistence.

Validation belongs at the edge.

Avoid large controller files.

---

# Dependency Injection

Prefer dependency injection.

Avoid hidden global state.

---

# Configuration

Configuration should come from:

Environment variables

Configuration files

Secret managers

Never hardcode secrets.

---

# Production Readiness Checklist

Before merging, every endpoint MUST satisfy:

- REST resource naming
- Correct HTTP method
- Correct HTTP status codes
- Runtime validation
- Strong typing
- Authentication
- Authorization
- Standardized errors
- Structured logging
- Metrics
- Tracing
- OpenAPI documentation
- Request examples
- Response examples
- Tests
- Version compatibility
- Security review
- Performance review
- Documentation review

If any item fails, the implementation is NOT production ready.

---

# Golden Rule

A production API is not complete when it works.

It is complete when it is:

- Correct
- Consistent
- Typed
- Secure
- Observable
- Tested
- Documented
- Maintainable
- Backward compatible
- Easy for both humans and AI agents to consume.
