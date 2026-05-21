# Clean Architecture en NestJS — auth + tasks (persistencia en memoria)

Backend en NestJS que demuestra Clean Architecture estricta, principios SOLID y
patrones de diseño aplicados con propósito. Dos contextos delimitados (`auth`, `tasks`)
más un núcleo `shared`, cada uno con cuatro capas (`domain`, `application`,
`infrastructure`, `presentation`).

**La persistencia es completamente en memoria. No hay base de datos, no hay Docker,
no hay dependencias externas.** Esto es deliberado — la arquitectura es el objetivo,
y el adaptador en memoria demuestra que los casos de uso están desacoplados de la
persistencia. Los datos se pierden en cada reinicio.

## Diagrama de dependencias entre capas

```
   ┌─────────────────────────┐   ┌─────────────────────────┐
   │      presentation       │   │      infrastructure     │
   │  controllers, http-dtos │   │  repos en memoria,      │
   │  guards, decoradores    │   │  bcrypt, jwt-token      │
   └────────────┬────────────┘   └────────────┬────────────┘
                │                             │
                │      ┌──────────────────────┘
                ▼      ▼
   ┌────────────────────────┐
   │       application      │
   │  use cases, ports,     │
   │  DTOs de aplicación    │
   └────────────┬───────────┘
                │
                ▼
   ┌────────────────────────┐
   │         domain         │
   │  entidades, value      │
   │  objects, errores,     │
   │  interfaces repository │
   └────────────────────────┘
```

- `domain` no importa de nadie.
- `application` importa únicamente de `domain`. Sin `@nestjs/*`, sin framework.
- `infrastructure` implementa los ports de `domain`/`application`. Conoce NestJS,
  bcrypt y `@nestjs/jwt`.
- `presentation` invoca use cases y usa guards/decoradores. No importa directamente
  de `infrastructure/persistence` ni de `infrastructure/services`.

## Patrones aplicados — por qué cada uno

### Repository

La interfaz (`UserRepository`, `TaskRepository`) vive en `domain/repositories/`.
El adaptador (`InMemoryUserRepository`, `InMemoryTaskRepository`) vive en
`infrastructure/persistence/`. Los use cases reciben la interfaz a través de
inyección de dependencias; nunca referencian la clase concreta. **Consecuencia:**
cambiar el adaptador en memoria por uno de Postgres requiere:
1. Escribir una nueva clase que implemente la misma interfaz.
2. Cambiar una línea `useClass` en el archivo del módulo.
Nada en `domain/` ni en `application/` cambia.

### Use Case

Una clase por operación de negocio, un único método `execute()`. Sin `@Injectable()`,
sin `@Inject()`. Esto mantiene `application/` agnóstico del framework. El módulo Nest
conecta adaptadores concretos mediante `useFactory`, lo que también permite instanciar
los use cases directamente en tests sin arrancar Nest.

### Value Object

`Email`, `Password` y `Uuid` validan en su constructor y son inmutables. Un email
inválido es irrepresentable después de la construcción — nunca puede llegar al
repositorio. `Password` aplica la política de longitud una sola vez, en un único lugar.

### Inversión de dependencias mediante tokens

Cada port exporta una constante string (`USER_REPOSITORY`, `TASK_REPOSITORY`, etc.)
junto a su interfaz. El módulo enlaza ese token con un adaptador concreto. Los use
cases declaran parámetros de constructor tipados como la interfaz; el token es el
handle de enlace que NestJS resuelve en tiempo de ejecución. Los propios use cases
no importan nada de `@nestjs/*`.

### Filtro de excepciones global

`DomainExceptionFilter` captura todas las excepciones. Los subtipos de `DomainError`
se mapean a códigos HTTP en un único bloque equivalente a un `switch`. Añadir un
nuevo tipo de error significa añadir un caso aquí — sin cambios en controllers,
sin `try/catch` dispersos.

## SOLID — dónde se ve

| Principio | Manifestación |
|---|---|
| SRP | Cada use case hace exactamente una cosa. `RegisterUserUseCase` no envía emails. |
| OCP | Cambiar bcrypt por argon2 significa un nuevo adaptador + una línea del módulo. Use cases intactos. |
| LSP | Cualquier implementación de `UserRepository` es intercambiable. Los tests lo confirman. |
| ISP | `PasswordHasher` tiene solo `hash` y `compare`. Sin `generateSalt`, sin `validateStrength`. |
| DIP | Los use cases dependen de `UserRepository` (interfaz), nunca de `InMemoryUserRepository`. |

## Mapeo Error → HTTP

| Error de dominio | HTTP |
|---|---|
| `ValidationError` | 400 |
| `UnauthorizedError` / `InvalidCredentialsError` | 401 |
| `NotFoundError` / `TaskNotFoundError` | 404 |
| `ConflictError` / `UserAlreadyExistsError` | 409 |
| (no manejado) | 500 |

## Persistencia en memoria — por diseño

Los `InMemoryUserRepository` e `InMemoryTaskRepository` de producción respaldan cada
`Map` en memoria. Los tests de repositorio reutilizan estas mismas clases — no hace
falta un fake separado porque la clase en memoria ya satisface el contrato del port.

**Cómo cambiar a una base de datos real:**
1. Crear `TypeOrmUserRepository implements UserRepository` en
   `auth/infrastructure/persistence/`.
2. En `auth/infrastructure/auth.module.ts`, cambiar:
   ```ts
   { provide: USER_REPOSITORY, useClass: InMemoryUserRepository }
   // por:
   { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository }
   ```
3. Añadir `TypeOrmModule.forFeature([UserOrmEntity])` al `imports` de ese módulo.
4. Repetir para `tasks`. Añadir `TypeOrmModule.forRootAsync(...)` al `AppModule`.
Ningún otro archivo del proyecto cambia.

## Trade-offs

**Qué cuesta la persistencia en memoria:**
- Sin durabilidad — todos los datos se pierden al reiniciar. No apto para producción.
- Solo un proceso — múltiples procesos Node tendrían stores independientes.
- Sin capacidades de consulta — rangos, ordenación y paginación requerirían iterar
  el `Map` completo. Una base de datos real delegaría esto al query planner.

**Por qué es aceptable aquí:**
El objetivo es demostrar que la arquitectura es correcta y testeable, no construir
un servicio en producción. El adaptador en memoria es la prueba más limpia posible
de que los use cases no dependen del mecanismo de persistencia.

## Lo que dejé fuera deliberadamente

- **Refresh tokens** — requiere otro port (`RefreshTokenStore`), lógica de rotación
  y revocación. Fuera del alcance de una demo de auth.
- **Roles / permisos** — ningún use case aquí los distingue.
- **Paginación, soft delete, filtrado** — añadirían ruido sin demostrar nada nuevo
  arquitectónicamente.
- **Domain events / CQRS** — ambos contextos son demasiado pequeños para justificar
  la sobrecarga. Sería decoración, no arquitectura.
- **Swagger, rate limiting, health checks, métricas, OAuth, Passport** — no es el
  objetivo del ejercicio.
- **TypeORM Active Record** — el proyecto usa Data Mapper (patrón repository) para
  mantener el dominio libre de dependencias del ORM.

## Cómo ejecutarlo

```bash
# 1. Copiar las variables de entorno y completar JWT_SECRET
cp .env.example .env

# 2. Instalar dependencias (sin paquetes de base de datos en runtime)
npm install

# 3. Arrancar
npm run start:dev     # http://localhost:3000

# 4. Tests (sin base de datos, sin arranque de Nest)
npm test
```

## Flujo end-to-end con curl

```bash
# Registro
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"sup3rsecret"}'
# → 201  {"id":"<uuid>","email":"alice@example.com"}

# Login
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"sup3rsecret"}'
# → 200  {"accessToken":"eyJhbGci..."}

# Copiar el token
TOKEN="eyJhbGci..."

# Crear una task
curl -s -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Comprar leche","description":"2L de avena"}'
# → 201  {"id":"<task-id>","userId":"...","title":"Comprar leche",...}

TASK_ID="<task-id>"

# Listar tasks
curl -s http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN"
# → 200  [{"id":"<task-id>",...}]

# Obtener una task
curl -s http://localhost:3000/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN"
# → 200  {"id":"<task-id>",...}

# Actualizar (marcar como completada)
curl -s -X PATCH http://localhost:3000/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
# → 200  {"id":"<task-id>","completed":true,...}

# Eliminar
curl -s -X DELETE http://localhost:3000/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN"
# → 204  (sin cuerpo)
```

## Estructura de carpetas

```
src/
├── main.ts                          # ValidationPipe global + DomainExceptionFilter
├── app.module.ts                    # composition root
│
├── shared/
│   ├── domain/
│   │   ├── errors/                  # Base DomainError + NotFound, Unauthorized, Validation, Conflict
│   │   └── value-objects/           # Uuid
│   └── infrastructure/
│       ├── filters/                 # DomainExceptionFilter → HTTP
│       └── config/                  # validación de env (JWT_SECRET, JWT_EXPIRES_IN, PORT)
│
├── auth/
│   ├── domain/
│   │   ├── entities/                # User (POJO, sin decoradores)
│   │   ├── value-objects/           # Email, Password
│   │   ├── repositories/            # Interfaz UserRepository + TOKEN
│   │   └── errors/                  # UserAlreadyExistsError, InvalidCredentialsError
│   ├── application/
│   │   ├── ports/                   # Interfaces PasswordHasher, TokenGenerator
│   │   ├── dtos/                    # RegisterUserInput/Output, LoginUserInput/Output
│   │   └── use-cases/               # RegisterUserUseCase, LoginUserUseCase + tests + fakes
│   ├── infrastructure/
│   │   ├── persistence/             # InMemoryUserRepository (respaldado por Map)
│   │   ├── services/                # BcryptPasswordHasher, JwtTokenGenerator
│   │   ├── guards/                  # JwtAuthGuard
│   │   └── auth.module.ts           # composition root — enlaza tokens a adaptadores
│   └── presentation/
│       ├── controllers/             # AuthController (delgado)
│       ├── http-dtos/               # RegisterHttpDto, LoginHttpDto (class-validator)
│       └── decorators/              # @CurrentUser()
│
└── tasks/
    ├── domain/
    │   ├── entities/                # Task (POJO, mutable via apply())
    │   ├── repositories/            # Interfaz TaskRepository + TOKEN
    │   └── errors/                  # TaskNotFoundError
    ├── application/
    │   ├── dtos/                    # CreateTaskInput, UpdateTaskInput, TaskOutput
    │   └── use-cases/               # Create, List, Get, Update, Delete + tests + fakes
    ├── infrastructure/
    │   ├── persistence/             # InMemoryTaskRepository (respaldado por Map)
    │   └── tasks.module.ts          # composition root — enlaza tokens a adaptadores
    └── presentation/
        ├── controllers/             # TasksController (delgado, todas las rutas con guard)
        └── http-dtos/               # CreateTaskHttpDto, UpdateTaskHttpDto (class-validator)
```
