# Persistence Specification

## Purpose

Postgres + Drizzle ORM data layer accessed exclusively through domain-defined repository interfaces, keeping domain code storage-agnostic.

## Requirements

### Requirement: Domain Repository Interfaces

Each feature's domain layer MUST define repository interfaces (ports) describing required persistence operations. The domain layer MUST NOT import Drizzle or any database-specific package.

#### Scenario: Domain layer has no infra imports

- GIVEN a domain module for a feature (e.g. contact, engagement)
- WHEN its imports are inspected
- THEN it MUST contain zero references to `drizzle-orm` or database client packages

### Requirement: Infrastructure Repository Implementations

Each domain repository interface MUST have a corresponding implementation in the feature's infrastructure layer using Drizzle ORM.

#### Scenario: Repository implementation satisfies interface

- GIVEN a domain repository interface `ContactMessageRepository`
- WHEN the infrastructure layer provides `DrizzleContactMessageRepository`
- THEN it MUST implement all methods declared by the interface
- AND application/domain code MUST depend only on the interface, not the concrete class

### Requirement: Versioned Schema and Migrations

Database schema MUST be defined via Drizzle schema files and changes MUST be tracked through versioned migration files committed to the repository.

#### Scenario: Schema change requires migration

- GIVEN a schema field is added or changed
- WHEN the change is committed
- THEN a corresponding migration file MUST be included in the same change

### Requirement: Boundary Validation

Data crossing the persistence boundary (API input, repository input) MUST be validated with Zod before reaching repository implementations.

#### Scenario: Invalid data rejected before persistence

- GIVEN malformed data reaches an API route
- WHEN Zod validation runs
- THEN the system MUST reject the request before any repository call is made

### Requirement: Environment-Only Credentials

The Postgres connection string MUST be read from environment variables only and MUST NOT be hardcoded or committed to the repository.

#### Scenario: Missing connection string

- GIVEN the `DATABASE_URL` environment variable is unset
- WHEN the application starts in a mode requiring the database
- THEN startup MUST fail fast with a clear configuration error
