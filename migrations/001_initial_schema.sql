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

-- Tabla usuario
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla rol
CREATE TABLE rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, id_empresa)
);

-- Tabla permiso
CREATE TABLE permiso (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, id_empresa)
);

-- Tabla usuario_rol
CREATE TABLE usuario_rol (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    id_rol INTEGER NOT NULL REFERENCES rol(id) ON DELETE CASCADE,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, id_rol, id_empresa)
);

-- Tabla rol_permisos
CREATE TABLE rol_permisos (
    id SERIAL PRIMARY KEY,
    id_rol INTEGER NOT NULL REFERENCES rol(id) ON DELETE CASCADE,
    id_permiso INTEGER NOT NULL REFERENCES permiso(id) ON DELETE CASCADE,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_rol, id_permiso, id_empresa)
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
CREATE INDEX idx_usuario_id_empresa ON usuario(id_empresa);
CREATE INDEX idx_usuario_rol_id_usuario ON usuario_rol(id_usuario);
CREATE INDEX idx_usuario_rol_id_rol ON usuario_rol(id_rol);
CREATE INDEX idx_usuario_rol_id_empresa ON usuario_rol(id_empresa);
CREATE INDEX idx_rol_permisos_id_rol ON rol_permisos(id_rol);
CREATE INDEX idx_rol_permisos_id_permiso ON rol_permisos(id_permiso);
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
CREATE TRIGGER update_usuario_updated_at BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rol_updated_at BEFORE UPDATE ON rol FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permiso_updated_at BEFORE UPDATE ON permiso FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuario_rol_updated_at BEFORE UPDATE ON usuario_rol FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rol_permisos_updated_at BEFORE UPDATE ON rol_permisos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_producto_updated_at BEFORE UPDATE ON producto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_almacen_updated_at BEFORE UPDATE ON almacen FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_producto_updated_at BEFORE UPDATE ON stock_producto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_material_updated_at BEFORE UPDATE ON material FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_material_updated_at BEFORE UPDATE ON stock_material FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_formula_producto_updated_at BEFORE UPDATE ON formula_producto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
