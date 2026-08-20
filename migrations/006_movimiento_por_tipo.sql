-- Migración para separar movimientos por tipo
-- Motor: PostgreSQL

-- 1. Crear tabla movimiento_producto
CREATE TABLE movimiento_producto (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_producto INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('venta', 'compra', 'consumo', 'produccion', 'transferencia')),
    id_almacen INTEGER NOT NULL REFERENCES almacen(id) ON DELETE CASCADE,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'eliminado')),
    descripcion TEXT,
    stock_actual_articulo DECIMAL(10, 2) DEFAULT 0,
    stock_actual_almacen DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla movimiento_material
CREATE TABLE movimiento_material (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_material INTEGER NOT NULL REFERENCES material(id) ON DELETE CASCADE,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('venta', 'compra', 'consumo', 'produccion', 'transferencia')),
    id_almacen INTEGER NOT NULL REFERENCES almacen(id) ON DELETE CASCADE,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'eliminado')),
    descripcion TEXT,
    stock_actual_articulo DECIMAL(10, 2) DEFAULT 0,
    stock_actual_almacen DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices para movimiento_producto
CREATE INDEX idx_movimiento_producto_id_empresa ON movimiento_producto(id_empresa);
CREATE INDEX idx_movimiento_producto_id_producto ON movimiento_producto(id_producto);
CREATE INDEX idx_movimiento_producto_tipo_movimiento ON movimiento_producto(tipo_movimiento);
CREATE INDEX idx_movimiento_producto_estado ON movimiento_producto(estado);
CREATE INDEX idx_movimiento_producto_fecha ON movimiento_producto(fecha);
CREATE INDEX idx_movimiento_producto_id_almacen ON movimiento_producto(id_almacen);

-- Indices para movimiento_material
CREATE INDEX idx_movimiento_material_id_empresa ON movimiento_material(id_empresa);
CREATE INDEX idx_movimiento_material_id_material ON movimiento_material(id_material);
CREATE INDEX idx_movimiento_material_tipo_movimiento ON movimiento_material(tipo_movimiento);
CREATE INDEX idx_movimiento_material_estado ON movimiento_material(estado);
CREATE INDEX idx_movimiento_material_fecha ON movimiento_material(fecha);
CREATE INDEX idx_movimiento_material_id_almacen ON movimiento_material(id_almacen);

-- Triggers para updated_at
CREATE TRIGGER update_movimiento_producto_updated_at BEFORE UPDATE ON movimiento_producto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_movimiento_material_updated_at BEFORE UPDATE ON movimiento_material FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Migrar datos existentes de movimiento a las nuevas tablas
INSERT INTO movimiento_producto (
    fecha, id_producto, cantidad, precio, total, tipo_movimiento, 
    id_almacen, id_empresa, id_usuario, estado, descripcion, 
    stock_actual_articulo, stock_actual_almacen, created_at, updated_at
)
SELECT 
    fecha, id_articulo, cantidad, precio, total, tipo_movimiento, 
    id_almacen, id_empresa, id_usuario, estado, descripcion, 
    stock_actual_articulo, stock_actual_almacen, created_at, updated_at
FROM movimiento
WHERE tipo_articulo = 'producto';

INSERT INTO movimiento_material (
    fecha, id_material, cantidad, precio, total, tipo_movimiento, 
    id_almacen, id_empresa, id_usuario, estado, descripcion, 
    stock_actual_articulo, stock_actual_almacen, created_at, updated_at
)
SELECT 
    fecha, id_articulo, cantidad, precio, total, tipo_movimiento, 
    id_almacen, id_empresa, id_usuario, estado, descripcion, 
    stock_actual_articulo, stock_actual_almacen, created_at, updated_at
FROM movimiento
WHERE tipo_articulo = 'material';

-- Eliminar tabla vieja
DROP TABLE movimiento CASCADE;
