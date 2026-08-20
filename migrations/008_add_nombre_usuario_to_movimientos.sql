-- Migración para almacenar el nombre del usuario en los movimientos dinámicamente
ALTER TABLE movimiento_producto ADD COLUMN nombre_usuario VARCHAR(255);
ALTER TABLE movimiento_material ADD COLUMN nombre_usuario VARCHAR(255);
