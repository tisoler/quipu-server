# AGENTS.md — Backend (NestJS)

API REST de Quipu. NestJS 10 + TypeORM 0.3 + PostgreSQL. Gestor de paquetes: **pnpm**.

## Comandos

```bash
pnpm install
pnpm start:dev      # desarrollo con watch (usa .env local)
pnpm build          # compila a dist/
pnpm start:prod     # node dist/main
pnpm lint           # eslint --fix
pnpm test           # jest (rootDir: src, *.spec.ts)
```

La app escucha en `PORT` (default 3000; los `.env` usan **3035**), prefijo global `/api`, Swagger en `/docs`, CORS habilitado para `localhost:3036`, `localhost:5173` y `https://quipu.tisoler.net.ar` (ver [main.ts](./src/main.ts)).

## Estructura

Un módulo por dominio, todos bajo `src/`:

```
src/
├── entities/          # Entidades TypeORM compartidas (una por tabla)
├── auth/              # Firebase Auth + permisos (strategy, guards, decorator)
├── productos/         # Artículos terminados
├── materiales/        # Insumos/materias primas
├── almacenes/         # Depósitos
├── rubros/            # Categorías de artículos
├── movimientos/       # Compras, ventas, consumo, producción, transferencias
├── inventario/        # Consultas de historial y stock actual
├── empresas/
├── app.module.ts      # Registro de módulos y entidades
└── main.ts
```

Cada módulo sigue el patrón `X.module.ts` + `X.controller.ts` + `X.service.ts` + `dto/` (create/update/filter con `class-validator`). Al agregar una entidad nueva hay que registrarla en el array `entities` de [app.module.ts](./src/app.module.ts).

## Reglas clave

- **`synchronize: false`**: el esquema nunca se toca solo con entidades. Todo cambio de esquema requiere una migración SQL nueva en `migrations/NNN_nombre.sql` (numerada correlativamente, se ejecuta a mano con `psql`; ver [migrations/README.md](./migrations/README.md)).
- **Validación global**: `ValidationPipe` con `whitelist + forbidNonWhitelisted + transform`. Los DTO definen todo lo aceptable; no leer campos del body fuera del DTO.
- **Auth**: los requests llegan con `Authorization: Bearer <Firebase ID token>`. `FirebaseStrategy` (passport-custom) lo verifica con `firebase-admin` (usa `firebase-service-account.json`) y adjunta el usuario con sus `permisos` leídos de Firestore. `FirebaseGuard` protege la ruta y `PermissionsGuard` + el decorador `@Permissions('...')` controlan el permiso específico:

```ts
@UseGuards(FirebaseGuard, PermissionsGuard)
@Permissions('escritura:compra-producto')
```

- **Dominio**: los artículos son `producto` o `material` (tablas y movimientos separados para cada uno). Tipos de movimiento: `venta`, `compra`, `consumo`, `produccion`, `transferencia`. El stock se deriva de los movimientos y se materializa en `stock_producto` / `stock_material`.
- Config vía `ConfigModule` (global) — nunca hardcodear valores de entorno.

## Entorno local

`.env` (ver [env.example](./env.example)): `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_*`, `PORT`. Los secretos JWT existen por compatibilidad histórica; la autenticación real es Firebase. El archivo `src/test.http` contiene requests de ejemplo.
