-- Tabla para códigos de confirmación de entrega
CREATE TABLE IF NOT EXISTS codigos_confirmacion (
    id_codigo INT AUTO_INCREMENT PRIMARY KEY,
    id_envio_fk INT NOT NULL,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    tipo ENUM('BODEGUERO_CHOFER', 'CLIENTE_CHOFER') NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    fecha_generado DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_usado DATETIME NULL,
    generado_por INT NULL COMMENT 'ID del usuario que generó el código (bodeguero o cliente)',
    usado_por INT NULL COMMENT 'ID del usuario que usó el código (chofer)',
    FOREIGN KEY (id_envio_fk) REFERENCES envios(id_envio) ON DELETE CASCADE,
    INDEX idx_codigo (codigo),
    INDEX idx_envio (id_envio_fk),
    INDEX idx_tipo_usado (tipo, usado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
