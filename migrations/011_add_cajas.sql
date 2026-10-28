-- Migración para Puestos de Venta y Cajas
-- caja_puesto: caja diaria de cada vendedor/puesto
-- caja_central: libro de entradas de la caja central (ingresos por cierre de cajas)

CREATE TABLE caja_puesto (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    id_usuario VARCHAR(64) NOT NULL,
    nombre_usuario VARCHAR(255),
    id_almacen INTEGER NOT NULL REFERENCES almacen(id) ON DELETE CASCADE,
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
    total_vendido DECIMAL(10, 2) NOT NULL DEFAULT 0,
    monto_declarado DECIMAL(10, 2),
    monto_transferido DECIMAL(10, 2),
    faltante DECIMAL(10, 2),
    sobrante DECIMAL(10, 2),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_caja_puesto_id_empresa ON caja_puesto(id_empresa);
CREATE INDEX idx_caja_puesto_id_usuario ON caja_puesto(id_usuario);
CREATE INDEX idx_caja_puesto_estado ON caja_puesto(estado);
CREATE INDEX idx_caja_puesto_fecha_apertura ON caja_puesto(fecha_apertura);

CREATE TABLE caja_central (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso-cierre')),
    monto DECIMAL(10, 2) NOT NULL,
    id_caja_puesto INTEGER REFERENCES caja_puesto(id) ON DELETE SET NULL,
    id_usuario VARCHAR(64) NOT NULL,
    nombre_usuario VARCHAR(255),
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_caja_central_id_empresa ON caja_central(id_empresa);
CREATE INDEX idx_caja_central_fecha ON caja_central(fecha);
CREATE INDEX idx_caja_central_id_caja_puesto ON caja_central(id_caja_puesto);

-- Vincular ventas del puesto con su caja
ALTER TABLE movimiento_producto ADD COLUMN id_caja_puesto INTEGER REFERENCES caja_puesto(id) ON DELETE SET NULL;
CREATE INDEX idx_movimiento_producto_id_caja_puesto ON movimiento_producto(id_caja_puesto);

-- Triggers para updated_at
CREATE TRIGGER update_caja_puesto_updated_at BEFORE UPDATE ON caja_puesto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_caja_central_updated_at BEFORE UPDATE ON caja_central FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
