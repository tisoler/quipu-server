-- Migración de facturación electrónica ARCA (AFIP) para Responsable Inscripto
-- Datos fiscales de empresa, alícuotas de IVA, clientes, puntos de venta,
-- venta (agrupador del POS) y comprobantes electrónicos + credenciales ARCA.

-- 1. Datos fiscales de la empresa (no vienen del WSFE, se validan/consultan)
ALTER TABLE empresa ADD COLUMN razon_social VARCHAR(255);
ALTER TABLE empresa ADD COLUMN condicion_iva VARCHAR(100) DEFAULT 'IVA Responsable Inscripto';
ALTER TABLE empresa ADD COLUMN fecha_inicio_actividades DATE;
ALTER TABLE empresa ADD COLUMN iibb VARCHAR(20);

-- 2. Precios con/sin IVA y alícuota por producto
ALTER TABLE producto ADD COLUMN precio_con_iva BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE producto ADD COLUMN alicuota_iva DECIMAL(5,2) NOT NULL DEFAULT 21.00;

-- 3. Puntos de venta asignados por ARCA
CREATE TABLE punto_venta (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    descripcion VARCHAR(255),
    predeterminado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_empresa, numero)
);
CREATE INDEX idx_punto_venta_id_empresa ON punto_venta(id_empresa);

-- 4. El puesto (caja) opera bajo un punto de venta; NULL = el predeterminado
ALTER TABLE caja_puesto ADD COLUMN id_punto_venta INTEGER REFERENCES punto_venta(id) ON DELETE SET NULL;

-- 4b. Configuración de punto de venta por almacén/puesto físico
ALTER TABLE almacen ADD COLUMN id_punto_venta INTEGER REFERENCES punto_venta(id) ON DELETE SET NULL;

-- 5. Clientes
CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    cuit VARCHAR(20),
    condicion_iva VARCHAR(100),
    domicilio VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_cliente_id_empresa ON cliente(id_empresa);
CREATE INDEX idx_cliente_nombre ON cliente(nombre);

-- 6. Venta: agrupa los ítems registrados en una operación del puesto
CREATE TABLE venta (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    id_caja_puesto INTEGER NOT NULL REFERENCES caja_puesto(id) ON DELETE CASCADE,
    id_cliente INTEGER REFERENCES cliente(id) ON DELETE SET NULL,
    tipo_pago VARCHAR(20),
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_venta_id_empresa ON venta(id_empresa);
CREATE INDEX idx_venta_id_caja_puesto ON venta(id_caja_puesto);

-- 7. Vincular cada movimiento de producto con su venta y congelar datos impositivos
ALTER TABLE movimiento_producto ADD COLUMN id_venta INTEGER REFERENCES venta(id) ON DELETE SET NULL;
ALTER TABLE movimiento_producto ADD COLUMN precio_con_iva BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE movimiento_producto ADD COLUMN alicuota_iva DECIMAL(5,2) NOT NULL DEFAULT 21.00;
CREATE INDEX idx_movimiento_producto_id_venta ON movimiento_producto(id_venta);

-- 8. Comprobante electrónico (una sola vez por venta: UNIQUE en id_venta)
CREATE TABLE comprobante (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    id_venta INTEGER NOT NULL UNIQUE REFERENCES venta(id) ON DELETE CASCADE,
    tipo_comprobante INTEGER NOT NULL,
    punto_venta INTEGER NOT NULL,
    nro_comprobante INTEGER NOT NULL,
    cae VARCHAR(20),
    cae_vencimiento DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    codigo_barras VARCHAR(64),
    mensaje_error TEXT,
    snapshot JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_comprobante_id_empresa ON comprobante(id_empresa);
CREATE INDEX idx_comprobante_estado ON comprobante(estado);

-- 9. Credenciales ARCA (certificado en claro + clave privada cifrada)
CREATE TABLE credenciales_arca (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    entorno VARCHAR(20) NOT NULL CHECK (entorno IN ('homologacion', 'produccion')),
    certificado TEXT NOT NULL,
    clave_privada_cifrada TEXT NOT NULL,
    vencimiento DATE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_credenciales_arca_id_empresa ON credenciales_arca(id_empresa);

-- Triggers para updated_at
CREATE TRIGGER update_punto_venta_updated_at BEFORE UPDATE ON punto_venta FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cliente_updated_at BEFORE UPDATE ON cliente FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venta_updated_at BEFORE UPDATE ON venta FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comprobante_updated_at BEFORE UPDATE ON comprobante FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credenciales_arca_updated_at BEFORE UPDATE ON credenciales_arca FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
