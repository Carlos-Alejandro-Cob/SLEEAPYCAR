ALTER TABLE envios ADD COLUMN precio DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE envios ADD COLUMN estado_pago ENUM('Pendiente', 'Pagado') DEFAULT 'Pendiente';
