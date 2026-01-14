# APYCAR Repartidor - Aplicación Flutter

Aplicación móvil para repartidores de APYCAR que permite gestionar entregas y escanear códigos de productos.

## Características

- ✅ Autenticación de repartidores
- ✅ Lista de envíos asignados
- ✅ Detalle de envíos con productos
- ✅ Escaneo de códigos de barras/QR
- ✅ Marcado de productos como entregados
- ✅ Seguimiento de progreso de entrega
- ✅ Interfaz moderna y responsive

## Requisitos

- Flutter SDK >= 3.0.0
- Dart SDK >= 3.0.0
- Android Studio / VS Code con extensiones de Flutter
- Backend Node.js corriendo en `http://localhost:3001` (o configurar la URL)

## Instalación

1. Navega a la carpeta del proyecto:
```bash
cd flutter_app
```

2. Instala las dependencias:
```bash
flutter pub get
```

3. Configura la URL del backend en `lib/services/api_service.dart`:
```dart
static const String baseUrl = 'http://TU_IP:3001/mobile/api';
```
   - Para Android Emulator: `http://10.0.2.2:3001/mobile/api`
   - Para iOS Simulator: `http://localhost:3001/mobile/api`
   - Para dispositivo físico: `http://TU_IP_LOCAL:3001/mobile/api`

## Configuración de Permisos

### Android

Agrega en `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
```

### iOS

Agrega en `ios/Runner/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceso a la cámara para escanear códigos de productos</string>
```

## Ejecutar la Aplicación

```bash
flutter run
```

## Estructura del Proyecto

```
flutter_app/
├── lib/
│   ├── main.dart                 # Punto de entrada
│   ├── models/                   # Modelos de datos
│   │   ├── envio.dart
│   │   ├── producto.dart
│   │   └── envio_detalle.dart
│   ├── services/                 # Servicios API
│   │   ├── api_service.dart
│   │   └── auth_service.dart
│   ├── providers/               # State management
│   │   └── auth_provider.dart
│   └── screens/                 # Pantallas
│       ├── login_screen.dart
│       ├── envios_list_screen.dart
│       └── envio_detalle_screen.dart
└── pubspec.yaml
```

## Uso

1. **Login**: Ingresa las credenciales de repartidor
2. **Lista de Envíos**: Visualiza todos los envíos asignados
3. **Detalle de Envío**: 
   - Toca un envío para ver sus productos
   - Usa el botón de escáner o ingresa el código manualmente
   - Los productos se marcan automáticamente como entregados
4. **Progreso**: Visualiza el progreso de entrega en tiempo real

## API Endpoints Utilizados

- `POST /mobile/api/login` - Autenticación
- `POST /mobile/api/logout` - Cerrar sesión
- `GET /mobile/api/envios` - Lista de envíos
- `GET /mobile/api/envio/:id` - Detalle de envío
- `POST /mobile/api/producto/buscar` - Buscar producto por código
- `POST /mobile/api/producto/entregar` - Marcar producto como entregado
- `GET /mobile/api/envio/:id/estado` - Estado de productos

## Notas

- La aplicación usa sesiones HTTP para mantener la autenticación
- Los productos entregados se guardan en la sesión del servidor
- Asegúrate de que el backend esté corriendo antes de usar la app

## Troubleshooting

### Error de conexión
- Verifica que el backend esté corriendo
- Verifica la URL en `api_service.dart`
- Para dispositivos físicos, asegúrate de usar la IP local de tu computadora

### Error de cámara
- Verifica los permisos en AndroidManifest.xml o Info.plist
- En Android, puede requerir permisos en tiempo de ejecución

### Error de autenticación
- Verifica que las credenciales sean correctas
- Verifica que el usuario tenga rol de REPARTIDOR
