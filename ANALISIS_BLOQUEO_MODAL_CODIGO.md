# Análisis: Bloqueo al generar código (sin errores en consola)

## Síntomas
- La página se bloquea al pulsar "Generar código" (bodeguero o cliente).
- No aparecen errores en la consola del navegador.
- El backend responde correctamente (queries OK, INSERT en `codigos_confirmacion`).

## Causas probables

### 1. **Modal abierto durante el fetch + `overflow: hidden` en `body`**
- Se abre el modal **antes** del fetch (con "Generando...") y se hace `body { overflow: hidden }`.
- En algunos navegadores o con ciertas extensiones, combinar overlay fijo + fetch + `overflow: hidden` puede producir comportamientos raros (layout, scroll, sensación de “bloqueo”).
- **Cambio**: Abrir el modal **solo cuando ya se tiene el código**. Mostrar carga solo en el botón (spinner + disabled) durante el fetch.

### 2. **`redirect: 'manual'` en fetch**
- Con `redirect: 'manual'`, el fetch no sigue redirecciones. En entornos con proxy o auth puede haber diferencias de comportamiento.
- **Cambio**: Quitar `redirect: 'manual'` y usar el valor por defecto. Si hay 302, se sigue; si la respuesta final no es JSON, se comprueba `Content-Type` y se trata como error.

### 3. **`r.text()` + `JSON.parse` vs `r.json()`**
- En teoría equivalente, pero `r.json()` consume el body una vez. Evitamos posibles edge cases con el stream.
- **Cambio**: Usar `r.json()` cuando `Content-Type` sea `application/json`.

### 4. **POST sin body**
- Se envía `Content-Type: application/json` pero sin `body`. Algún middleware o proxy podría esperar cuerpo y mantener la conexión abierta.
- **Cambio**: Enviar `body: JSON.stringify({})` en el POST.

### 5. **`scrollIntoView` y `focus()`**
- `scrollIntoView({ behavior: 'smooth' })` o `focus()` en contenedores con scroll (modal) pueden, en casos raros, provocar bucles de layout o interacción rara.
- **Cambio**: Eliminar `scrollIntoView` y `focus()` hasta confirmar que el bloqueo desaparece.

### 6. **Doble clic / varias peticiones**
- Varios clics rápidos pueden lanzar varios fetch y varias actualizaciones del mismo modal, generando estados inconsistentes.
- **Cambio**: Deshabilitar el botón al primer clic y no rehabilitarlo hasta error o cierre del modal.

### 7. **Navegación full-page (p.ej. envío de formulario)**
- Si el botón formara parte de un `<form>` o hubiera un submit por otro motivo, la página podría “navegar” y la consola limpiarse (“sin errores”).
- **Comprobado**: El botón es `type="button"`, no está dentro del formulario de filtros y se usa `preventDefault` / `stopPropagation` en el delegado. No se ha detectado submit involuntario.

### 8. **Scripts globales (`app.js`, `carrito.js`, etc.)**
- No se han encontrado listeners que intercepten el clic en “Generar código” ni que provoquen navegación. Los modales de Bootstrap no se usan para este flujo.

## Cambios aplicados

1. **Flujo “fetch primero, modal después”**  
   - Clic → deshabilitar botón y mostrar spinner en el botón.  
   - Fetch → sin abrir modal.  
   - Éxito → abrir modal y mostrar el código.  
   - Error → `alert` con el mensaje y rehabilitar botón.

2. **Fetch simplificado**  
   - Sin `redirect: 'manual'`.  
   - `r.json()` cuando la respuesta sea JSON.  
   - `body: JSON.stringify({})` en el POST.

3. **Sin `scrollIntoView` ni `focus()`** en el modal del código.

4. **Guard contra doble clic**: botón deshabilitado durante la petición.

5. **Logs de depuración** (opcionales): si se define `window.DEBUG_MODAL_CODIGO = true` en consola antes de probar, se hace `console.log` en pasos clave para rastrear dónde se detiene el flujo.

## Cómo depurar si sigue bloqueando

1. Abrir DevTools → pestaña **Console**.
2. Activar **“Preserve log”** (o equivalente) para que no se borre al recargar.
3. En consola: `window.DEBUG_MODAL_CODIGO = true`.
4. Pulsar “Generar código” y revisar los `console.log` **Bodeguero**: `[Modal código] Fetch iniciado` → `Respuesta: 200` → `JSON recibido` → `Modal abierto con código`. **Cliente**: `[Cliente código]` mismo flujo.
5. Comprobar pestaña **Network**: petición a `/admin/api/envios/:id/generar-codigo` (o ruta de rastreo), status, si la respuesta es JSON y si el body llega.

Si con estos cambios el bloqueo persiste, los logs y Network indicarán si el fallo está en la petición, en la respuesta o en la actualización del DOM/modal.
