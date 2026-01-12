CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL
);

ALTER TABLE productos CHANGE COLUMN IF EXISTS nombre_producto descripcion VARCHAR(255) NOT NULL;

CREATE TABLE IF NOT EXISTS envio_productos (
    id_envio_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_envio_fk INT NOT NULL,
    id_producto_fk INT NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (id_envio_fk) REFERENCES envios(id_envio),
    FOREIGN KEY (id_producto_fk) REFERENCES productos(id_producto)
);

ALTER TABLE envios DROP COLUMN IF EXISTS id_producto_fk;
