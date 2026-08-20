-- Agregar 'transferencia' a los tipos de movimiento permitidos
ALTER TABLE movimiento DROP CONSTRAINT IF EXISTS movimiento_tipo_movimiento_check;
ALTER TABLE movimiento ADD CONSTRAINT movimiento_tipo_movimiento_check 
  CHECK (tipo_movimiento IN ('venta', 'compra', 'consumo', 'produccion', 'transferencia'));
