-- Migración para funcionalidad de inventario
-- Motor: PostgreSQL

-- Agregar nuevos tipos de movimiento al CHECK constraint
ALTER TABLE movimiento DROP CONSTRAINT IF EXISTS movimiento_tipo_movimiento_check;
ALTER TABLE movimiento ADD CONSTRAINT movimiento_tipo_movimiento_check 
  CHECK (tipo_movimiento IN ('venta', 'compra', 'consumo', 'produccion'));

-- Agregar columnas de stock a movimiento
ALTER TABLE movimiento 
  ADD COLUMN IF NOT EXISTS stock_actual_articulo DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_actual_almacen DECIMAL(10, 2) DEFAULT 0;

-- Crear índice para mejorar consultas de stock
CREATE INDEX IF NOT EXISTS idx_movimiento_stock_articulo ON movimiento(id_articulo, tipo_articulo, fecha);
CREATE INDEX IF NOT EXISTS idx_movimiento_stock_almacen ON movimiento(id_articulo, tipo_articulo, id_almacen, fecha);

-- Tabla inventario para histórico
CREATE TABLE IF NOT EXISTS inventario (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_articulo INTEGER NOT NULL,
    tipo_articulo VARCHAR(20) NOT NULL CHECK (tipo_articulo IN ('producto', 'material')),
    id_almacen INTEGER REFERENCES almacen(id) ON DELETE CASCADE,
    stock_articulo DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock_almacen DECIMAL(10, 2) NOT NULL DEFAULT 0,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para inventario
CREATE INDEX IF NOT EXISTS idx_inventario_id_empresa ON inventario(id_empresa);
CREATE INDEX IF NOT EXISTS idx_inventario_id_articulo ON inventario(id_articulo);
CREATE INDEX IF NOT EXISTS idx_inventario_tipo_articulo ON inventario(tipo_articulo);
CREATE INDEX IF NOT EXISTS idx_inventario_id_almacen ON inventario(id_almacen);
CREATE INDEX IF NOT EXISTS idx_inventario_fecha ON inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_inventario_articulo_almacen ON inventario(id_articulo, tipo_articulo, id_almacen, fecha);

-- Función para actualizar stocks cuando se crea un movimiento
CREATE OR REPLACE FUNCTION actualizar_stock_movimiento()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_stock_articulo DECIMAL(10, 2);
    nuevo_stock_almacen DECIMAL(10, 2);
    factor DECIMAL(10, 2);
BEGIN
    -- Determinar factor según tipo de movimiento
    IF NEW.tipo_movimiento IN ('venta', 'consumo') THEN
        factor := -1;
    ELSE
        factor := 1;
    END IF;

    -- Obtener último stock del artículo (sin considerar almacén)
    SELECT COALESCE(MAX(stock_actual_articulo), 0) INTO nuevo_stock_articulo
    FROM movimiento
    WHERE id_articulo = NEW.id_articulo
      AND tipo_articulo = NEW.tipo_articulo
      AND id_empresa = NEW.id_empresa
      AND fecha < NEW.fecha
      AND estado = 'activo';

    -- Obtener último stock del artículo en el almacén específico
    SELECT COALESCE(MAX(stock_actual_almacen), 0) INTO nuevo_stock_almacen
    FROM movimiento
    WHERE id_articulo = NEW.id_articulo
      AND tipo_articulo = NEW.tipo_articulo
      AND id_almacen = NEW.id_almacen
      AND id_empresa = NEW.id_empresa
      AND fecha < NEW.fecha
      AND estado = 'activo';

    -- Calcular nuevos stocks
    NEW.stock_actual_articulo := nuevo_stock_articulo + (NEW.cantidad * factor);
    NEW.stock_actual_almacen := nuevo_stock_almacen + (NEW.cantidad * factor);

    -- Actualizar stocks de movimientos siguientes
    UPDATE movimiento
    SET stock_actual_articulo = stock_actual_articulo + (NEW.cantidad * factor),
        stock_actual_almacen = CASE 
            WHEN id_almacen = NEW.id_almacen 
            THEN stock_actual_almacen + (NEW.cantidad * factor)
            ELSE stock_actual_almacen
        END
    WHERE id_articulo = NEW.id_articulo
      AND tipo_articulo = NEW.tipo_articulo
      AND id_empresa = NEW.id_empresa
      AND fecha > NEW.fecha
      AND estado = 'activo';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stocks al insertar
DROP TRIGGER IF EXISTS trigger_actualizar_stock_movimiento ON movimiento;
CREATE TRIGGER trigger_actualizar_stock_movimiento
    BEFORE INSERT ON movimiento
    FOR EACH ROW
    WHEN (NEW.estado = 'activo')
    EXECUTE FUNCTION actualizar_stock_movimiento();

-- Función para recalcular stocks cuando se elimina un movimiento
CREATE OR REPLACE FUNCTION recalcular_stocks_eliminacion()
RETURNS TRIGGER AS $$
DECLARE
    factor DECIMAL(10, 2);
BEGIN
    -- Si se está eliminando (cambiando estado a 'eliminado')
    IF NEW.estado = 'eliminado' AND OLD.estado = 'activo' THEN
        -- Determinar factor según tipo de movimiento
        IF OLD.tipo_movimiento IN ('venta', 'consumo') THEN
            factor := 1; -- Revertir la disminución
        ELSE
            factor := -1; -- Revertir el aumento
        END IF;

        -- Recalcular stocks de movimientos siguientes
        UPDATE movimiento
        SET stock_actual_articulo = stock_actual_articulo + (OLD.cantidad * factor),
            stock_actual_almacen = CASE 
                WHEN id_almacen = OLD.id_almacen 
                THEN stock_actual_almacen + (OLD.cantidad * factor)
                ELSE stock_actual_almacen
            END
        WHERE id_articulo = OLD.id_articulo
          AND tipo_articulo = OLD.tipo_articulo
          AND id_empresa = OLD.id_empresa
          AND fecha > OLD.fecha
          AND estado = 'activo';

        -- Recalcular el stock del movimiento eliminado
        SELECT COALESCE(MAX(stock_actual_articulo), 0) INTO NEW.stock_actual_articulo
        FROM movimiento
        WHERE id_articulo = OLD.id_articulo
          AND tipo_articulo = OLD.tipo_articulo
          AND id_empresa = OLD.id_empresa
          AND fecha < OLD.fecha
          AND estado = 'activo';

        SELECT COALESCE(MAX(stock_actual_almacen), 0) INTO NEW.stock_actual_almacen
        FROM movimiento
        WHERE id_articulo = OLD.id_articulo
          AND tipo_articulo = OLD.tipo_articulo
          AND id_almacen = OLD.id_almacen
          AND id_empresa = OLD.id_empresa
          AND fecha < OLD.fecha
          AND estado = 'activo';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular stocks al eliminar
DROP TRIGGER IF EXISTS trigger_recalcular_stocks_eliminacion ON movimiento;
CREATE TRIGGER trigger_recalcular_stocks_eliminacion
    BEFORE UPDATE ON movimiento
    FOR EACH ROW
    WHEN (NEW.estado = 'eliminado' AND OLD.estado = 'activo')
    EXECUTE FUNCTION recalcular_stocks_eliminacion();
