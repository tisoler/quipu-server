-- Migración para Rubros y su relación con Productos
CREATE TABLE rubro (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rubro_producto (
    id_rubro INTEGER NOT NULL REFERENCES rubro(id) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    PRIMARY KEY (id_rubro, id_producto)
);

-- Trigger para updated_at en rubro
CREATE TRIGGER update_rubro_modtime
    BEFORE UPDATE ON rubro
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
