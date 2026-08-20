-- Migración para agregar campo codigo a producto y material
ALTER TABLE producto ADD COLUMN codigo VARCHAR(100);
ALTER TABLE material ADD COLUMN codigo VARCHAR(100);

-- Índices para búsqueda rápida por código
CREATE INDEX idx_producto_codigo ON producto(codigo, id_empresa);
CREATE INDEX idx_material_codigo ON material(codigo, id_empresa);
