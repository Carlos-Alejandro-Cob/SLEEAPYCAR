# Guía de Ejecución - APYCAR Repartidor Flutter

## Opción 1: Ejecutar en Emulador Android (Recomendado)

### Paso 1: Instalar Android Studio
1. Descarga Android Studio desde: https://developer.android.com/studio
2. Instala Android Studio con Android SDK
3. Abre Android Studio y ve a **Tools > SDK Manager**
4. Instala:
   - Android SDK Platform (última versión)
   - Android SDK Build-Tools
   - Android Emulator

### Paso 2: Crear un Emulador Android
1. En Android Studio, ve a **Tools > Device Manager**
2. Click en **Create Device**
3. Selecciona un dispositivo (ej: Pixel 5)
4. Selecciona una imagen del sistema (ej: API 33 o superior)
5. Click **Finish**

### Paso 3: Configurar la URL del Backend
Edita `lib/services/api_service.dart` y cambia la URL:

```dart
// Para Android Emulator usa:
static const String baseUrl = 'http://10.0.2.2:3001/mobile/api';
```

### Paso 4: Ejecutar la Aplicación
```bash
cd flutter_app
flutter pub get
flutter run
```

Cuando aparezca la lista de dispositivos, selecciona el emulador Android.

---

## Opción 2: Ejecutar en Dispositivo Físico Android

### Paso 1: Habilitar Modo Desarrollador
1. Ve a **Configuración > Acerca del teléfono**
2. Toca **Número de compilación** 7 veces
3. Ve a **Configuración > Opciones de desarrollador**
4. Activa **Depuración USB**

### Paso 2: Conectar el Dispositivo
1. Conecta tu Android por USB
2. Acepta el diálogo de depuración USB en el teléfono
3. Verifica la conexión:
```bash
flutter devices
```

### Paso 3: Obtener la IP Local de tu Computadora
- **Windows**: Abre CMD y ejecuta `ipconfig`, busca "IPv4"
- **Mac/Linux**: Ejecuta `ifconfig` o `ip addr`

Ejemplo: Si tu IP es `192.168.1.100`

### Paso 4: Configurar la URL
Edita `lib/services/api_service.dart`:

```dart
// Reemplaza con tu IP local:
static const String baseUrl = 'http://192.168.1.100:3001/mobile/api';
```

**IMPORTANTE**: Asegúrate de que tu computadora y el dispositivo estén en la misma red WiFi.

### Paso 5: Ejecutar
```bash
cd flutter_app
flutter run
```

---

## Opción 3: Ejecutar en Web (Para Pruebas Rápidas)

### Paso 1: Habilitar Soporte Web
```bash
cd flutter_app
flutter create . --platforms=web
```

### Paso 2: Configurar URL
```dart
static const String baseUrl = 'http://localhost:3001/mobile/api';
```

### Paso 3: Ejecutar
```bash
flutter run -d chrome
```

**Nota**: El escáner de códigos no funcionará en web, pero puedes probar la entrada manual.

---

## Opción 4: Ejecutar en Windows Desktop

### Paso 1: Habilitar Soporte Windows
```bash
cd flutter_app
flutter create . --platforms=windows
```

### Paso 2: Configurar URL
```dart
static const String baseUrl = 'http://localhost:3001/mobile/api';
```

### Paso 3: Ejecutar
```bash
flutter run -d windows
```

**Nota**: El escáner de códigos puede tener limitaciones en Windows.

---

## Verificar que el Backend esté Corriendo

Antes de ejecutar la app, asegúrate de que el servidor Node.js esté corriendo:

```bash
# En la carpeta raíz del proyecto (SLEEAPYCAR)
npm start
# o
node app.js
```

El servidor debe estar en `http://localhost:3001`

---

## Solución de Problemas

### Error: "No supported devices connected"
- Instala un emulador o conecta un dispositivo físico
- Verifica con: `flutter devices`

### Error de Conexión al Backend
1. Verifica que el backend esté corriendo
2. Verifica la URL en `api_service.dart`
3. Para dispositivo físico, asegúrate de usar la IP local correcta
4. Verifica que el firewall no bloquee el puerto 3001

### Error: "Connection refused"
- El backend no está corriendo o la URL es incorrecta
- Verifica que puedas acceder a `http://TU_URL/mobile/api/envios` desde un navegador

### Error de Permisos de Cámara (Android)
Agrega en `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
```

### Ver Dispositivos Disponibles
```bash
flutter devices
```

### Limpiar y Reconstruir
```bash
flutter clean
flutter pub get
flutter run
```

---

## Comandos Útiles

```bash
# Ver dispositivos disponibles
flutter devices

# Ejecutar en dispositivo específico
flutter run -d <device-id>

# Ejecutar en modo release (más rápido)
flutter run --release

# Ver logs
flutter logs

# Hot reload (presiona 'r' mientras la app corre)
# Hot restart (presiona 'R' mientras la app corre)
```

---

## Próximos Pasos

Una vez que la app esté corriendo:
1. Inicia sesión con credenciales de repartidor
2. Verás la lista de envíos asignados
3. Toca un envío para ver sus productos
4. Usa el escáner o ingresa códigos manualmente
5. Los productos se marcan automáticamente como entregados
