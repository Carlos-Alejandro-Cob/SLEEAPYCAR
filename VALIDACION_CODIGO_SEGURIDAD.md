# Validación por código de seguridad en el proceso de entrega

## Resumen

El repartidor **no puede** avanzar a **"En reparto"** ni **"Entregado"** sin ingresar un código de seguridad de 6 dígitos. El código para **"Entregado"** lo genera únicamente el **cliente**; el de **"En reparto"** lo genera el **bodeguero**.

## Reglas del código

- **Numérico**: solo dígitos 0-9.
- **Longitud fija**: 6 dígitos.
- **Aleatorio**: generado por el sistema.
- **No reutilizable**: un solo uso por código.
- **Asociado al pedido**: cada código pertenece a un envío concreto.
- **No permanente**: se genera cuando el pedido está en proceso de entrega.

## Generación

- **Cliente (CLIENTE_CHOFER)**: En rastreo, cuando el pedido está **En Ruta**, **En reparto** o **En envío**. El cliente genera el código y se lo da al repartidor al recibir el pedido.
- **Bodeguero (BODEGUERO_CHOFER)**: Desde la lista de envíos, botón "Generar código". Se usa al agregar envío a la ruta y al marcar "En envío" → "En reparto".

Los códigos se guardan en la tabla `codigos_confirmacion`.

## Validación

Antes de cambiar el estado del pedido, el sistema comprueba:

1. **Formato**: exactamente 6 dígitos numéricos.
2. **Existencia**: el código existe en BD.
3. **Pedido**: el código corresponde al envío que se está actualizando.
4. **Uso**: el código no ha sido usado.

**Si el código es válido:**

- Se marca como usado.
- Se permite el cambio de estado.

**Si el código no es válido:**

- Se rechaza la operación.
- El estado del pedido **no** cambia.
- Se muestra un mensaje de error claro (formato, no corresponde, ya utilizado, etc.).

## Endpoints

| Método | Ruta | Uso |
|--------|------|-----|
| `POST` | `/rastreo/:id/generar-codigo` | Cliente genera código (pedido en proceso de entrega). |
| `POST` | `/admin/api/envios/:id/generar-codigo` | Bodeguero genera código para repartidor. |
| `POST` | `/admin/api/envios/:id/validar-codigo-seguridad` | Validar código sin usarlo (opcional). Body: `{ "codigo": "123456", "tipo": "CLIENTE_CHOFER" }`. |
| `PUT`  | `/admin/envios/:id` | Repartidor actualiza estado; si aplica, debe enviar `codigo_confirmacion`. |

## Flujo repartidor

1. **Agregar a ruta**: código del bodeguero. Si falla la validación, el envío no se agrega.
2. **En envío → En reparto**: código del bodeguero. Si falla, el estado no cambia.
3. **Entregado**: código del cliente. Si falla, el estado no cambia.

## Archivos relevantes

- `models/CodigoConfirmacion.js`: formato, `validarSinUsar`, `validarYUsar`, generación.
- `controllers/envioController.js`: actualización de estado, `validarCodigoSeguridad`, `generarCodigoBodeguero`.
- `controllers/publicController.js`: `generarCodigoConfirmacion` (cliente).
- `routes/adminRoutes.js`: rutas de códigos y validación.
- `routes/publicRoutes.js`: ruta de generación en rastreo.
- Vistas: `views/admin/repartidor.ejs`, `views/public/details.ejs`.
