-- Migración inicial del esquema Quipu
-- Motor: PostgreSQL

-- Tabla empresa
CREATE TABLE empresa (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    localidad VARCHAR(255),
    direccion VARCHAR(255),
    cuit VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla producto
CREATE TABLE producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    presentacion VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'no-activo')),
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    stock_minimo INTEGER DEFAULT 0,
    precio DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla almacen
CREATE TABLE almacen (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    ubicacion VARCHAR(255),
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla stock_producto
CREATE TABLE stock_producto (
    id SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    id_almacen INTEGER NOT NULL REFERENCES almacen(id) ON DELETE CASCADE,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_producto, id_almacen, id_empresa)
);

-- Tabla material
CREATE TABLE material (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    presentacion VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'no-activo')),
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    stock_minimo INTEGER DEFAULT 0,
    precio DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla stock_material
CREATE TABLE stock_material (
    id SERIAL PRIMARY KEY,
    id_material INTEGER NOT NULL REFERENCES material(id) ON DELETE CASCADE,
    id_almacen INTEGER NOT NULL REFERENCES almacen(id) ON DELETE CASCADE,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_material, id_almacen, id_empresa)
);

-- Tabla formula_producto
CREATE TABLE formula_producto (
    id SERIAL PRIMARY KEY,
    id_material INTEGER NOT NULL REFERENCES material(id) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    cantidad DECIMAL(10, 2) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_material, id_producto, id_empresa)
);

-- Índices para mejorar performance
CREATE INDEX idx_producto_id_empresa ON producto(id_empresa);
CREATE INDEX idx_material_id_empresa ON material(id_empresa);
CREATE INDEX idx_almacen_id_empresa ON almacen(id_empresa);
CREATE INDEX idx_stock_producto_id_producto ON stock_producto(id_producto);
CREATE INDEX idx_stock_producto_id_almacen ON stock_producto(id_almacen);
CREATE INDEX idx_stock_material_id_material ON stock_material(id_material);
CREATE INDEX idx_stock_material_id_almacen ON stock_material(id_almacen);
CREATE INDEX idx_formula_producto_id_producto ON formula_producto(id_producto);
CREATE INDEX idx_formula_producto_id_material ON formula_producto(id_material);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_empresa_updated_at BEFORE UPDATE ON empresa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_producto_updated_at BEFORE UPDATE ON producto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_almacen_updated_at BEFORE UPDATE ON almacen FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_producto_updated_at BEFORE UPDATE ON stock_producto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_material_updated_at BEFORE UPDATE ON material FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_material_updated_at BEFORE UPDATE ON stock_material FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_formula_producto_updated_at BEFORE UPDATE ON formula_producto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
