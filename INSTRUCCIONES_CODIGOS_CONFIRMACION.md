# Instrucciones: Sistema de Códigos de Confirmación

## Flujo Completo

### 1. Bodeguero → Chofer

**Paso a paso:**
1. Bodeguero accede a la lista de envíos (`/admin/envios`)
2. Hace clic en "Editar" en un envío
3. Cambia el estado a **"Despachado"**
4. Guarda el formulario
5. **El sistema genera automáticamente un código de 6 dígitos**
6. El código aparece en el mensaje de éxito (ejemplo: "Código de confirmación: **123456**")
7. **Bodeguero proporciona el código al chofer**
8. Chofer ingresa a su panel (`/admin/repartidor`)
9. Hace clic en "Acciones" del envío correspondiente
10. Selecciona "En envío"
11. Ingresa el código de 6 dígitos proporcionado por el bodeguero
12. El estado cambia a **"En envío"**

### 2. Cliente → Chofer

**Paso a paso:**
1. Cuando el envío está en estado **"En envío"**, el cliente puede acceder a su página de seguimiento
2. Cliente busca su envío en `/rastreo` usando el código de envío
3. En la página de detalles, si el estado es "En envío", verá un botón para **"Generar Código de Confirmación"**
4. Cliente hace clic en el botón
5. Se genera un código de 6 dígitos que aparece en pantalla
6. **Cliente proporciona este código al chofer** cuando recibe el paquete
7. Chofer ingresa a su panel (`/admin/repartidor`)
8. Hace clic en "Acciones" del envío correspondiente
9. Selecciona "Entregado"
10. Ingresa el código de 6 dígitos proporcionado por el cliente
11. El estado cambia a **"Entregado"**

## Importante

- ⚠️ Los códigos son de **6 dígitos numéricos**
- ⚠️ Cada código **solo se puede usar una vez**
- ⚠️ Si se genera un nuevo código del mismo tipo, el anterior se invalida automáticamente
- ⚠️ Los códigos son únicos por envío y tipo

## Solución de Problemas

### "Código no válido o ya utilizado"
- El código fue ingresado incorrectamente
- El código ya fue usado anteriormente
- Verificar que el código corresponda al envío correcto

### "El código no corresponde a este envío"
- El código pertenece a otro envío
- Verificar que esté ingresando el código en el envío correcto

### "Solo se puede generar código cuando el envío está 'En envío'"
- El cliente solo puede generar código cuando el envío ya está en estado "En envío"
- Verificar que el chofer haya confirmado la recepción primero
