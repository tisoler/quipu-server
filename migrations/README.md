# Migraciones de Base de Datos

## Ejecutar Migraciones

### Opción 1: Usando psql directamente

```bash
# Conectarse a PostgreSQL y ejecutar la migración
psql -U postgres -d quipu -f migrations/002_movimiento.sql

# O si necesitas especificar el host y puerto:
psql -h localhost -p 5432 -U postgres -d quipu -f migrations/002_movimiento.sql
```

### Opción 2: Desde psql interactivo

```bash
# Conectarse a PostgreSQL
psql -U postgres -d quipu

# Luego ejecutar:
\i migrations/002_movimiento.sql
```

### Opción 3: Copiar y pegar el contenido SQL

1. Abre el archivo `migrations/002_movimiento.sql`
2. Copia todo el contenido
3. Conéctate a tu base de datos PostgreSQL usando cualquier cliente (pgAdmin, DBeaver, etc.)
4. Ejecuta el SQL copiado

## Orden de Ejecución

1. Primero ejecuta `001_initial_schema.sql` (si no lo has hecho)
2. Luego ejecuta `002_movimiento.sql`

## Verificar que la migración se ejecutó correctamente

```sql
-- Verificar que la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'movimiento';

-- Ver la estructura de la tabla
\d movimiento
```
