# Clean Architecture in NestJS — auth + tasks

A NestJS backend showcasing strict Clean Architecture, SOLID, and purposeful
design patterns. Two bounded contexts (`auth`, `tasks`) plus a `shared`
kernel, four layers each (`domain`, `application`, `infrastructure`,
`presentation`).

## Layer dependencies

```
            ┌───────────────────────┐
            │     presentation      │
            │  (controllers, DTOs)  │
            └─────────┬─────────────┘
                      │
                      ▼
            ┌───────────────────────┐
            │     application       │
            │  (use cases, ports)   │
            └─────────┬─────────────┘
                      │
                      ▼
            ┌───────────────────────┐
            │        domain         │
            │ (entities, VOs, errs) │
            └───────────────────────┘
                      ▲
                      │ implements ports
            ┌─────────┴─────────────┐
            │    infrastructure     │
            │ (ORM, JWT, bcrypt)    │
            └───────────────────────┘
```

- `domain` imports from no one.
- `application` imports only from `domain`. **No `@nestjs/*`, no `typeorm`.**
- `infrastructure` implements domain/application ports. Knows TypeORM, JWT, bcrypt.
- `presentation` calls use cases and uses guards/decorators. Does not touch
  `infrastructure/persistence/*` or `services/*` directly.

## Patterns applied and why

- **Repository** (`domain/repositories/` interface, `infrastructure/persistence/*.repository.ts` adapter)
  isolates the domain from TypeORM. The same interface is satisfied by an
  in-memory fake used in tests — no database needed.

- **Use Case** (`application/use-cases/*.use-case.ts`, single `execute()`):
  one operation = one class. SRP. Easy to wire alone or compose, and the
  controller is a pass-through.

- **Value Object** (`Email`, `Password`, `Uuid`): self-validating, immutable
  primitives. Invalid email cannot be constructed, so it cannot reach the
  persistence layer.

- **Mapper** (`infrastructure/persistence/*.mapper.ts`): explicit ORM ↔ Domain
  translation. The schema can evolve (column rename, snake_case, audit fields)
  without rippling into the domain.

- **Dependency Inversion via tokens** (string constants exported next to the
  port, bound via `useFactory` in modules). Use cases never `@Inject` —
  the application layer stays framework-agnostic. The Nest module is the only
  thing that maps `USER_REPOSITORY` → `TypeOrmUserRepository`.

- **Global exception filter** (`shared/infrastructure/filters/`): one place
  maps `DomainError` subtypes to HTTP. Use cases throw domain errors and
  know nothing about Express.

## SOLID — where it shows up

- **SRP**: each use case does one thing. Compare `RegisterUserUseCase` and
  `LoginUserUseCase` — no shared base class, no helper struts.
- **OCP**: swap bcrypt for argon2 by binding `PASSWORD_HASHER` to a new
  adapter. Use cases are untouched.
- **LSP**: `InMemoryUserRepository` and `TypeOrmUserRepository` satisfy the
  same `UserRepository` interface. The tests prove this by running against
  the in-memory one.
- **ISP**: `PasswordHasher` has exactly `hash` and `compare`. No
  `generateSalt`, no `validateStrength`.
- **DIP**: use cases depend on `UserRepository` (the interface), never on
  `TypeOrmUserRepository`.

## Error → HTTP mapping

| Domain error                           | HTTP |
|----------------------------------------|------|
| `ValidationError`                      | 400  |
| `UnauthorizedError` / `InvalidCredentialsError` | 401  |
| `NotFoundError` / `TaskNotFoundError`  | 404  |
| `ConflictError` / `UserAlreadyExistsError` | 409  |
| (unhandled)                            | 500  |

## Trade-offs

This architecture is **not free**:

- More files. A "create task" path touches a controller, a use case, a
  domain entity, a repository interface, a TypeORM entity, and a mapper.
- Two parallel models (`User` domain vs `UserOrmEntity`) require a mapper
  to be kept in sync.
- Indirection has a cost when reading code: jumping from controller to
  use case to port to adapter takes more clicks than a `service.do()`.

**When I would not use it:** a simple CRUD with no business rules — a thin
NestJS service hitting TypeORM directly is faster to write and easier to
read. Clean Architecture earns its keep when the domain has rules, when
adapters are likely to change, or when the test surface needs to be
decoupled from infrastructure.

## What I deliberately left out

- **Refresh tokens** — out of scope for a "register/login" demo. Adding them
  would mean another port (`RefreshTokenStore`) and rotation rules.
- **Roles / permissions** — no use case here distinguishes them.
- **Pagination / soft delete on tasks** — would clutter the example without
  demonstrating anything new.
- **Domain events / CQRS** — both contexts are too small to need them. Would
  be theatre, not architecture.
- **Swagger, rate limiting, health checks, metrics, OAuth, Passport** — not
  the point of the exercise.

## Running it

```bash
# 1. Start Postgres
docker-compose up -d

# 2. Configure env
cp .env.example .env

# 3. Install + run
npm install
npm run start:dev     # http://localhost:3000

# 4. Tests (no DB needed — they use in-memory fakes)
npm test
```

> Migrations: TypeORM `synchronize: true` is enabled for the demo. In real
> projects you would generate migrations with `typeorm migration:generate`
> and disable `synchronize`.

## End-to-end with curl

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"sup3rsecret"}'
# → 201  {"id":"...","email":"alice@example.com"}

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"sup3rsecret"}'
# → 200  {"accessToken":"eyJhbGciOi..."}

TOKEN="eyJ..."   # paste the accessToken

# Create a task
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","description":"2L"}'

# List tasks
curl http://localhost:3000/tasks -H "Authorization: Bearer $TOKEN"

# Get one (replace :id)
curl http://localhost:3000/tasks/<id> -H "Authorization: Bearer $TOKEN"

# Update
curl -X PATCH http://localhost:3000/tasks/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete
curl -X DELETE http://localhost:3000/tasks/<id> -H "Authorization: Bearer $TOKEN"
# → 204
```

## Folder layout (skeleton)

```
src/
├── main.ts                          # global ValidationPipe + DomainExceptionFilter
├── app.module.ts                    # composition root
│
├── shared/
│   ├── domain/{errors,value-objects}/
│   └── infrastructure/{filters,config,database}/
│
├── auth/
│   ├── domain/{entities,value-objects,repositories,errors}/
│   ├── application/{ports,dtos,use-cases}/
│   ├── infrastructure/{persistence,services,guards,auth.module.ts}
│   └── presentation/{controllers,http-dtos,decorators}/
│
└── tasks/
    ├── domain/{entities,repositories,errors}/
    ├── application/{dtos,use-cases}/
    ├── infrastructure/{persistence,tasks.module.ts}
    └── presentation/{controllers,http-dtos}/
```
