-- Cache del Ticket de Acceso (TA) de ARCA por empresa y entorno.
-- Evita pedir un TA nuevo en cada emisión (ARCA rechaza el relogin
-- con "alreadyAuthenticated" mientras haya un TA vigente) y sobrevive
-- a reinicios del backend.

CREATE TABLE ticket_acceso (
    id SERIAL PRIMARY KEY,
    id_empresa INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    entorno VARCHAR(20) NOT NULL CHECK (entorno IN ('homologacion', 'produccion')),
    token TEXT NOT NULL,
    sign TEXT NOT NULL,
    expiracion TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_empresa, entorno)
);

CREATE INDEX idx_ticket_acceso_id_empresa ON ticket_acceso(id_empresa);

CREATE TRIGGER update_ticket_acceso_updated_at BEFORE UPDATE ON ticket_acceso FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
