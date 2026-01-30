-- Migración para tabla movimiento
-- Motor: PostgreSQL

-- Tabla movimiento
CREATE TABLE movimiento (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_articulo INTEGER NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('venta', 'compra')),
    tipo_articulo VARCHAR(20) NOT NULL CHECK (tipo_articulo IN ('producto', 'material')),
    id_almacen INTEGER NOT NULL REFERENCES almacen(id) ON DELETE CASCADE,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'eliminado')),
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_movimiento_id_empresa ON movimiento(id_empresa);
CREATE INDEX idx_movimiento_id_articulo ON movimiento(id_articulo);
CREATE INDEX idx_movimiento_tipo_articulo ON movimiento(tipo_articulo);
CREATE INDEX idx_movimiento_tipo_movimiento ON movimiento(tipo_movimiento);
CREATE INDEX idx_movimiento_estado ON movimiento(estado);
CREATE INDEX idx_movimiento_fecha ON movimiento(fecha);
CREATE INDEX idx_movimiento_id_almacen ON movimiento(id_almacen);
CREATE INDEX idx_movimiento_id_usuario ON movimiento(id_usuario);

-- Trigger para updated_at
CREATE TRIGGER update_movimiento_updated_at BEFORE UPDATE ON movimiento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Constraint para validar que id_articulo exista según tipo_articulo
-- Nota: Esta validación se hará a nivel de aplicación ya que PostgreSQL no soporta
-- constraints condicionales entre tablas diferentes fácilmente
