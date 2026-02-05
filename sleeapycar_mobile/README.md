# SLEE APYCAR - App Móvil

App Flutter para roles **Repartidor** y **Bodeguero**, conectada al backend Node.js SLEEAPYCAR.

## Estructura (clean architecture simplificada)

- `lib/data/` — Servicios (API con Dio, cookies).
- `lib/models/` — Modelos de datos (User, Envio).
- `lib/providers/` — Estado con Provider (AuthProvider).
- `lib/screens/` — Pantallas (Login, Home).
- `lib/widgets/` — Widgets reutilizables.

## Autenticación

- El backend usa **sesiones con cookie** `connect.sid` (Passport.js).
- Se usa **Dio** + **dio_cookie_manager** + **cookie_jar** (PersistCookieJar) para enviar y persistir la cookie.
- Login: `POST /mobile/api/login` con `nombre_usuario` y `password` (form-urlencoded).
- Tras el login, el servidor envía `Set-Cookie: connect.sid=...` y CookieManager la guarda.

## Configuración de la URL del backend

En `lib/data/auth_service.dart` el `baseUrl` por defecto es:

- Emulador Android: `http://10.0.2.2:3001/mobile`
- Dispositivo físico: `http://<IP_DE_TU_PC>:3001/mobile`

Puedes cambiar la URL con `AuthProvider.setBaseUrl(url)` o pasando `baseUrl` al crear `AuthService`.

## Cómo ejecutar

1. Backend SLEEAPYCAR corriendo (por ejemplo `npm start` en la carpeta del backend).
2. `flutter pub get`
3. `flutter run`

## Roles

- **Bodeguero** (id_rol 2): despacha envíos y genera códigos.
- **Repartidor** (id_rol 3): recibe envíos, valida códigos y entrega.

El backend actual puede restringir el login móvil solo a Repartidor (y Super Admin); si quieres permitir también Bodeguero, hay que ajustar `mobileController.loginMobile` en el backend.
