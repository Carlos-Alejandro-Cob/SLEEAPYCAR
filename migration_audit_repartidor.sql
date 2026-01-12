-- Agregar columna id_repartidor a la tabla envios
ALTER TABLE envios ADD COLUMN id_repartidor INT DEFAULT NULL;
ALTER TABLE envios ADD CONSTRAINT fk_envios_repartidor FOREIGN KEY (id_repartidor) REFERENCES usuarios(id_usuario);

-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    accion VARCHAR(255) NOT NULL,
    detalles TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
