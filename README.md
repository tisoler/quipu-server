# Quipu Server

API backend para la aplicación Quipu, construida con NestJS y PostgreSQL.

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- pnpm

## Instalación

1. Instalar dependencias:
```bash
pnpm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de base de datos y configuración JWT.

3. Ejecutar migraciones SQL:
```bash
psql -U postgres -d quipu -f migrations/001_initial_schema.sql
```

4. Iniciar el servidor en modo desarrollo:
```bash
pnpm run start:dev
```

El servidor estará disponible en `http://localhost:3000`
La documentación Swagger estará disponible en `http://localhost:3000/docs`

## Estructura del Proyecto

```
src/
├── auth/              # Módulo de autenticación
├── productos/         # Módulo de productos
├── materiales/        # Módulo de materiales
├── almacenes/         # Módulo de almacenes
├── entities/          # Entidades TypeORM
└── main.ts            # Punto de entrada
```

## Endpoints Principales

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Refrescar token
- `GET /api/productos` - Listar productos (requiere permiso `lectura:producto`)
- `POST /api/productos` - Crear producto (requiere permiso `escritura:producto`)
- `PATCH /api/productos/:id` - Actualizar producto
- `PATCH /api/productos/:id/estado` - Cambiar estado de producto
- Similar para materiales y almacenes

## Permisos

Los permisos se definen en el formato: `{accion}:{recurso}`
Ejemplos:
- `lectura:producto`
- `escritura:producto`
- `lectura:material`
- `escritura:material`
- `lectura:almacen`
- `escritura:almacen`
