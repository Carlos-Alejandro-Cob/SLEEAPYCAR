-- Agregar campo direccion a la tabla usuarios si no existe
-- Este campo se usará para almacenar la dirección de las sucursales

-- Verificar si la columna existe antes de agregarla (compatible con MySQL/MariaDB)
SET @dbname = DATABASE();
SET @tablename = 'usuarios';
SET @columnname = 'direccion';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE
            (TABLE_SCHEMA = @dbname)
            AND (TABLE_NAME = @tablename)
            AND (COLUMN_NAME = @columnname)
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(255) DEFAULT NULL AFTER email')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Comentario en la columna para documentación (si se soporta)
-- ALTER TABLE usuarios 
-- MODIFY COLUMN direccion VARCHAR(255) DEFAULT NULL 
-- COMMENT 'Dirección de la sucursal (solo para usuarios con rol Sucursal)';
