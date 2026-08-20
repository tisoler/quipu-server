-- Add tipo_producto to producto table
ALTER TABLE producto ADD COLUMN tipo_producto VARCHAR(1);

-- Add check constraint for A, B, C
ALTER TABLE producto ADD CONSTRAINT chk_tipo_producto CHECK (tipo_producto IN ('A', 'B', 'C'));

-- Comment on column
COMMENT ON COLUMN producto.tipo_producto IS 'Categorización del producto (A, B o C)';
