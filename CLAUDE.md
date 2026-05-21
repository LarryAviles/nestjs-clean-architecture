# CLAUDE.md

Persistent context for Claude Code. Read this file before touching any code in this project.

## What this project is

A **NestJS** backend with **strict Clean Architecture** implementing:
- Authentication (register / login) with JWT.
- Task management (CRUD) scoped to the authenticated user.

This is a technical demonstration project. The priority is **architectural clarity and defensible code**, not features. Do not add functionality that was not explicitly requested.

## Stack

- NestJS + TypeScript (`strict: true`)
- PostgreSQL + TypeORM (**DataMapper, never Active Record**)
- JWT access token via `@nestjs/jwt` (**no Passport, no refresh token**)
- bcrypt for hashing
- class-validator + class-transformer (presentation layer only)
- Jest

## Installed skills — when to use them

This project has these skills available. Consult them proactively; do not rely on memory for framework specifics.

- **nestjs-best-practices** — modules, providers, dependency injection, guards, pipes, filters, lifecycle. Use whenever wiring NestJS infrastructure or presentation code.
- **nodejs-backend-patterns** — repository/adapter patterns, layering, error handling, configuration. Use for application/infrastructure design decisions.
- **typescript-advanced-types** — generics, mapped/conditional types, branded types, discriminated unions. Use when typing ports, value objects, and result types.
- **nodejs-best-practices** — async handling, runtime concerns, project hygiene. Use as a general baseline.

## Rule #1 — Domain purity (non-negotiable)

**`domain/` and `application/` must NOT import `@nestjs/*` or `typeorm`.**

- Domain entities are plain TypeScript classes (POJOs). No `@Entity`, no `@Column`, no `@Injectable`.
- ORM entities (with TypeORM decorators) live only in `infrastructure/persistence/` and are distinct from domain entities.
- Mapping between the two is explicit, in one `*.mapper.ts` per aggregate.

Before saving any file in `domain/` or `application/`, check the imports. If `@nestjs` or `typeorm` appears, it is broken.

## Rule #2 — Dependency direction

Dependencies point inward. Never outward.

```
   presentation ──┐
                  ├──> application ──> domain
infrastructure ──┘
```

- `domain` → imports from no one.
- `application` → only from `domain`.
- `infrastructure` → from `domain` and `application` (implements their ports).
- `presentation` → from `application` and `domain`. Does not import from `infrastructure` except guards and filters registered in modules.

## Folder structure

Two bounded contexts (`auth`, `tasks`) plus `shared`. Each context has all four layers.

```
src/
├── main.ts                          # global ValidationPipe + global exception filter
├── app.module.ts                    # root composition root
│
├── shared/
│   ├── domain/
│   │   ├── errors/                  # base DomainError + subtypes
│   │   └── value-objects/           # Uuid
│   └── infrastructure/
│       ├── filters/                 # domain-exception.filter (DomainError → HTTP)
│       ├── config/                  # env
│       └── database/                # typeorm config
│
├── auth/
│   ├── domain/
│   │   ├── entities/                # user.entity.ts (POJO)
│   │   ├── value-objects/           # email.vo, password.vo
│   │   ├── repositories/            # user.repository.ts (interface/port)
│   │   └── errors/
│   ├── application/
│   │   ├── ports/                   # password-hasher.port, token-generator.port (interfaces)
│   │   ├── dtos/                    # use-case DTOs (NOT HTTP)
│   │   └── use-cases/               # register-user, login-user
│   ├── infrastructure/
│   │   ├── persistence/             # user.orm-entity, user.mapper, typeorm-user.repository
│   │   ├── services/                # bcrypt-password-hasher, jwt-token-generator
│   │   ├── guards/                  # jwt-auth.guard
│   │   └── auth.module.ts           # module composition root
│   └── presentation/
│       ├── controllers/
│       ├── http-dtos/               # with class-validator
│       └── decorators/              # current-user
│
└── tasks/
    ├── domain/                      # task.entity, task.repository (port), errors
    ├── application/                 # use-cases (create, list, get, update, delete) + dtos
    ├── infrastructure/              # task.orm-entity, task.mapper, typeorm-task.repository, tasks.module
    └── presentation/                # controllers, http-dtos
```

## Patterns applied (and where they live)

Each pattern solves a concrete problem. If you add a new one, justify the problem. Do not add patterns for aesthetics.

| Pattern | Location | Problem it solves |
|---|---|---|
| Repository | port in `domain/repositories/`, adapter in `infrastructure/persistence/` | Isolates domain from TypeORM; enables tests with an in-memory fake, no DB |
| Use Case | `application/use-cases/`, single `execute()` method | One business operation = one class = one reason to change (SRP) |
| Value Object | `domain/value-objects/` (Email, Password, Uuid) | Encapsulates validation and invariants; immutable, self-validating objects |
| Mapper | `infrastructure/persistence/*.mapper.ts` | Explicit ORM ↔ Domain conversion; lets both evolve independently |
| DIP via tokens | binding in `*.module.ts` with `@Inject(TOKEN)` | Use cases depend on interfaces, not concrete implementations |
| Exception Filter | `shared/infrastructure/filters/` | Maps `DomainError` → HTTP codes in a single place |

## SOLID — how it shows up here

- **SRP**: a use case does one thing. If it needs to do two, split it.
- **OCP**: swapping the hasher or token generator only touches the module binding, never the use case.
- **LSP**: any repository implementation is interchangeable. The in-memory test fake satisfies the same interface as the TypeORM one.
- **ISP**: small interfaces. `PasswordHasher` only has `hash` and `compare`.
- **DIP**: use cases depend on the repository interface, never on `TypeOrmXRepository`.

## Code conventions

- **Controllers are thin**: receive request → call use case → return response. No business logic.
- **Validation lives in presentation only**: `class-validator` in the `http-dtos`. The domain never receives unvalidated data. `application` DTOs are plain interfaces/classes, no validation decorators.
- **Errors as domain exceptions**: throw subtypes of `DomainError` from domain/application. The global filter maps them. Use cases do not return HTTP codes or know about Express.
- **No `any`**: if unavoidable, comment inline why.
- **DI tokens as exported string constants**, not symbols. Define them near the port or in the module.
- **Comments only justify architectural decisions**, never narrate code.
- **File names**: `kebab-case` with role suffix (`.use-case.ts`, `.repository.ts`, `.vo.ts`, `.mapper.ts`, `.orm-entity.ts`, `.http-dto.ts`).

## Error → HTTP mapping (global filter)

| Domain error | HTTP |
|---|---|
| `ValidationError` | 400 |
| `UnauthorizedError` / `InvalidCredentialsError` | 401 |
| `NotFoundError` / `TaskNotFoundError` | 404 |
| `UserAlreadyExistsError` | 409 |
| (unhandled) | 500 |

## Testing

- Use cases are tested **without booting Nest or Postgres**, using in-memory fakes that implement the ports.
- If a use case cannot be tested without the database, dependency inversion is wrong. Fix it.
- Minimum required fakes: `InMemoryUserRepository`, `InMemoryTaskRepository`, `FakePasswordHasher`, `FakeTokenGenerator`.
- Place `.spec.ts` files next to the file they test.

## What NOT to do (scope is closed)

Do not add any of the following unless explicitly requested:
- Refresh tokens, roles/permissions, OAuth.
- Pagination, soft delete, advanced filtering on tasks.
- Domain events, CQRS, event sourcing, messaging.
- Swagger, advanced logging, rate limiting, health checks, metrics.
- Passport.
- TypeORM Active Record.

If a task seems to need something on this list, ask first whether it is in scope.

## Endpoints

**Auth** (public)
- `POST /auth/register` → `{ email, password }` → `{ id, email }` (409 if exists)
- `POST /auth/login` → `{ email, password }` → `{ accessToken }` (401 if invalid)

**Tasks** (require JWT)
- `POST /tasks` → `{ title, description? }`
- `GET /tasks` → authenticated user's tasks
- `GET /tasks/:id` → 404 if missing or not owned by the user
- `PATCH /tasks/:id` → `{ title?, description?, completed? }`
- `DELETE /tasks/:id`

`Task` model: `id, userId, title, description?, completed (default false), createdAt, updatedAt`.

## Sub-agents

This project defines specialized sub-agents in `.claude/agents/`. Delegate to them when a task is clearly scoped to their area:

- **auth-agent** — anything inside `src/auth/**`. Owns the auth bounded context end-to-end.
- **tasks-agent** — anything inside `src/tasks/**`. Owns the tasks bounded context end-to-end.
- **architecture-guardian** — invoke to review any change for dependency-direction violations, domain purity, and SOLID adherence before considering work done. Use it as a reviewer, not an author.

When a change spans both contexts or touches `shared/`, handle it in the main thread and have `architecture-guardian` review.

## When working on this project

1. Identify which layer the change falls into before writing.
2. Verify the dependency direction.
3. If you touch a port, update all its implementations (real + test fakes).
4. If you add a use case, add its test with fakes.
5. Keep controllers thin and the domain pure.
6. Consult the relevant installed skill instead of guessing framework specifics.
