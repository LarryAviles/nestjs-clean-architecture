# Clean Architecture en NestJS — auth + tasks

Backend en NestJS que demuestra Clean Architecture estricta, SOLID y patrones
de diseño aplicados con propósito. Dos contextos delimitados (`auth`, `tasks`)
más un núcleo `shared`, con cuatro capas cada uno (`domain`, `application`,
`infrastructure`, `presentation`).

## Dependencias entre capas

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
                      │ implementa los ports
            ┌─────────┴─────────────┐
            │    infrastructure     │
            │ (ORM, JWT, bcrypt)    │
            └───────────────────────┘
```

- `domain` no importa de nadie.
- `application` importa únicamente de `domain`. **Sin `@nestjs/*`, sin `typeorm`.**
- `infrastructure` implementa los ports de domain/application. Conoce TypeORM, JWT y bcrypt.
- `presentation` invoca use cases y usa guards/decoradores. No toca
  `infrastructure/persistence/*` ni `services/*` directamente.

## Patrones aplicados y por qué

- **Repository** (interfaz en `domain/repositories/`, adaptador en
  `infrastructure/persistence/*.repository.ts`) aísla el dominio de TypeORM.
  La misma interfaz se satisface con un fake en memoria usado en los tests —
  no hace falta base de datos.

- **Use Case** (`application/use-cases/*.use-case.ts`, un único `execute()`):
  una operación = una clase. SRP. Fácil de invocar de forma aislada o
  componer, y el controller queda como un simple pasamanos.

- **Value Object** (`Email`, `Password`, `Uuid`): primitivos inmutables que
  se autovalidan. No es posible construir un email inválido, por lo que no
  puede llegar a la capa de persistencia.

- **Mapper** (`infrastructure/persistence/*.mapper.ts`): traducción explícita
  ORM ↔ Dominio. El esquema puede evolucionar (renombrar columnas, pasar a
  snake_case, añadir campos de auditoría) sin filtrarse al dominio.

- **Inversión de dependencias mediante tokens** (constantes string exportadas
  junto al port, ligadas con `useFactory` en los módulos). Los use cases
  nunca usan `@Inject` — la capa application se mantiene agnóstica al
  framework. El módulo Nest es lo único que mapea `USER_REPOSITORY` →
  `TypeOrmUserRepository`.

- **Exception filter global** (`shared/infrastructure/filters/`): un único
  lugar mapea los subtipos de `DomainError` a HTTP. Los use cases lanzan
  errores de dominio y no saben nada de Express.

## SOLID — dónde se ve

- **SRP**: cada use case hace una sola cosa. Comparar `RegisterUserUseCase` y
  `LoginUserUseCase` — sin clase base común, sin helpers compartidos.
- **OCP**: cambiar bcrypt por argon2 = enlazar `PASSWORD_HASHER` a un nuevo
  adaptador. Los use cases no se tocan.
- **LSP**: `InMemoryUserRepository` y `TypeOrmUserRepository` satisfacen la
  misma interfaz `UserRepository`. Los tests lo demuestran ejecutándose
  contra el fake en memoria.
- **ISP**: `PasswordHasher` tiene exactamente `hash` y `compare`. Sin
  `generateSalt`, sin `validateStrength`.
- **DIP**: los use cases dependen de `UserRepository` (la interfaz), nunca
  de `TypeOrmUserRepository`.

## Mapeo Error → HTTP

| Error de dominio                       | HTTP |
|----------------------------------------|------|
| `ValidationError`                      | 400  |
| `UnauthorizedError` / `InvalidCredentialsError` | 401  |
| `NotFoundError` / `TaskNotFoundError`  | 404  |
| `ConflictError` / `UserAlreadyExistsError` | 409  |
| (no manejado)                          | 500  |

## Trade-offs

Esta arquitectura **no es gratis**:

- Más archivos. La ruta de "crear una task" toca un controller, un use case,
  una entidad de dominio, una interfaz de repository, una entidad de TypeORM
  y un mapper.
- Dos modelos paralelos (`User` de dominio vs. `UserOrmEntity`) requieren un
  mapper que hay que mantener sincronizado.
- La indirección tiene coste de lectura: saltar de controller a use case, a
  port y a adaptador requiere más clics que un `service.do()`.

**Cuándo no la usaría:** un CRUD simple sin reglas de negocio — un service
delgado de NestJS golpeando TypeORM directamente se escribe más rápido y se
lee mejor. Clean Architecture vale la pena cuando el dominio tiene reglas,
cuando los adaptadores van a cambiar, o cuando la superficie de testing
necesita desacoplarse de la infraestructura.

## Lo que dejé fuera deliberadamente

- **Refresh tokens** — fuera del alcance para una demo de "register/login".
  Añadirlos implicaría otro port (`RefreshTokenStore`) y reglas de rotación.
- **Roles / permisos** — ningún use case aquí los distingue.
- **Paginación / soft delete en tasks** — ensuciarían el ejemplo sin
  demostrar nada nuevo.
- **Domain events / CQRS** — ambos contextos son demasiado pequeños para
  necesitarlos. Sería teatro, no arquitectura.
- **Swagger, rate limiting, health checks, métricas, OAuth, Passport** — no
  es el objetivo del ejercicio.

## Cómo ejecutarlo

```bash
# 1. Arrancar Postgres
docker-compose up -d

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Instalar y correr
npm install
npm run start:dev     # http://localhost:3000

# 4. Tests (sin BD — usan fakes en memoria)
npm test
```

> Migraciones: en la demo `synchronize: true` de TypeORM está activado. En
> proyectos reales generarías migraciones con `typeorm migration:generate` y
> desactivarías `synchronize`.

## Flujo end-to-end con curl

```bash
# Registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"sup3rsecret"}'
# → 201  {"id":"...","email":"alice@example.com"}

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"sup3rsecret"}'
# → 200  {"accessToken":"eyJhbGciOi..."}

TOKEN="eyJ..."   # pega aquí el accessToken

# Crear una task
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk","description":"2L"}'

# Listar tasks
curl http://localhost:3000/tasks -H "Authorization: Bearer $TOKEN"

# Obtener una (sustituye :id)
curl http://localhost:3000/tasks/<id> -H "Authorization: Bearer $TOKEN"

# Actualizar
curl -X PATCH http://localhost:3000/tasks/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Eliminar
curl -X DELETE http://localhost:3000/tasks/<id> -H "Authorization: Bearer $TOKEN"
# → 204
```

## Estructura de carpetas (esqueleto)

```
src/
├── main.ts                          # ValidationPipe global + DomainExceptionFilter
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
