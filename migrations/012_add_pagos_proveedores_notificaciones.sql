-- Migración para tipos de pago, proveedores y notificaciones
-- movimiento_producto.tipo_pago: medio de cobro de las ventas del puesto
-- proveedor: ABM de proveedores de productos y materiales
-- notificacion: alertas in-app (faltante/sobrante en cierre de caja)

-- Medio de pago de las ventas
ALTER TABLE movimiento_producto ADD COLUMN tipo_pago VARCHAR(20);
CREATE INDEX idx_movimiento_producto_tipo_pago ON movimiento_producto(tipo_pago);

-- Proveedores
CREATE TABLE proveedor (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proveedor_id_empresa ON proveedor(id_empresa);

-- Productos: talle, color y proveedor
ALTER TABLE producto ADD COLUMN talle VARCHAR(50);
ALTER TABLE producto ADD COLUMN color VARCHAR(50);
ALTER TABLE producto ADD COLUMN id_proveedor INTEGER REFERENCES proveedor(id) ON DELETE SET NULL;
CREATE INDEX idx_producto_id_proveedor ON producto(id_proveedor);

-- Materiales: proveedor
ALTER TABLE material ADD COLUMN id_proveedor INTEGER REFERENCES proveedor(id) ON DELETE SET NULL;
CREATE INDEX idx_material_id_proveedor ON material(id_proveedor);

-- Desglose de totales por medio de pago al cerrar la caja
ALTER TABLE caja_puesto ADD COLUMN totales_por_pago JSONB;

-- Notificaciones in-app
CREATE TABLE notificacion (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT,
    id_caja_puesto INTEGER REFERENCES caja_puesto(id) ON DELETE SET NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notificacion_id_empresa ON notificacion(id_empresa);
CREATE INDEX idx_notificacion_id_empresa_leida ON notificacion(id_empresa, leida);

-- Triggers para updated_at
CREATE TRIGGER update_proveedor_updated_at BEFORE UPDATE ON proveedor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notificacion_updated_at BEFORE UPDATE ON notificacion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
