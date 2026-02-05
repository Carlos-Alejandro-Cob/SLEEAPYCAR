import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

import '../models/user.dart';

/// Excepción cuando el servidor responde 401 (credenciales o sesión).
class AuthUnauthorizedException implements Exception {
  final String message;
  AuthUnauthorizedException([this.message = 'No autorizado']);
}

/// Excepción cuando el servidor responde 403 (rol no permitido).
class AuthForbiddenException implements Exception {
  final String message;
  AuthForbiddenException([this.message = 'Acceso denegado']);
}

/// Servicio de autenticación contra el backend SLEEAPYCAR.
/// Usa sesiones (cookie `connect.sid`) con Dio + CookieManager + PersistCookieJar.
class AuthService {
  static const String _cookieName = 'connect.sid';

  late final Dio _dio;
  late final PersistCookieJar _cookieJar;

  /// Base URL del backend. Ej: http://10.3.1.134:3001/mobile
  /// Para emulador Android: http://10.0.2.2:3001/mobile
  String get baseUrl => _baseUrl;
  String _baseUrl;

  AuthService({String? baseUrl}) : _baseUrl = baseUrl ?? 'http://10.0.2.2:3001/mobile' {
    _cookieJar = CookieJar(); // Por defecto en memoria; usar setCookieJar con PersistCookieJar para persistir
    _dio = _createDio();
  }

  /// Inicializa el CookieJar persistente para guardar `connect.sid` entre sesiones.
  /// Llamar en main antes de usar el AuthService y luego authService.setCookieJar(jar).
  static Future<PersistCookieJar> initCookieJar() async {
    final dir = await getApplicationDocumentsDirectory();
    return PersistCookieJar(
      storage: FileStorage(path.join(dir.path, '.cookies')),
    );
  }

  /// Configura el servicio con un CookieJar persistente (recomendado en main).
  void setCookieJar(CookieJar jar) {
    _cookieJar = jar;
    _dio.interceptors.removeWhere((e) => e is CookieManager);
    _dio.interceptors.add(CookieManager(_cookieJar));
  }

  void setBaseUrl(String url) {
    _baseUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
    _dio.options.baseUrl = _baseUrl;
  }

  Dio _createDio() {
    final dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      contentType: Headers.formUrlEncodedContentType,
      responseType: ResponseType.json,
      validateStatus: (status) => true,
    ));

    dio.interceptors.add(CookieManager(_cookieJar));
    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));

    return dio;
  }

  Dio get dio => _dio;

  /// Login con usuario y contraseña.
  /// Envía POST a /api/login con form-urlencoded (nombre_usuario, password).
  /// Guarda la cookie `connect.sid` automáticamente vía CookieManager.
  /// Lanza [AuthUnauthorizedException] en 401, [AuthForbiddenException] en 403.
  Future<User> login(String nombreUsuario, String password) async {
    try {
      final body = 'nombre_usuario=${Uri.encodeComponent(nombreUsuario.trim())}&password=${Uri.encodeComponent(password)}';
      final response = await _dio.post<Map<String, dynamic>>(
        '/api/login',
        data: body,
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
          followRedirects: false,
        ),
      );

      final status = response.statusCode ?? 0;
      final data = response.data;

      if (status == 401) {
        final msg = (data is Map && data['message'] != null)
            ? data['message'] as String
            : 'Credenciales incorrectas';
        throw AuthUnauthorizedException(msg);
      }

      if (status == 403) {
        final msg = (data is Map && data['message'] != null)
            ? data['message'] as String
            : 'No tienes permiso para acceder a esta aplicación';
        throw AuthForbiddenException(msg);
      }

      if (status != 200) {
        final msg = (data is Map && data['message'] != null)
            ? data['message'] as String
            : 'Error del servidor ($status)';
        throw AuthUnauthorizedException(msg);
      }

      if (data is! Map<String, dynamic>) {
        throw AuthUnauthorizedException('Respuesta inválida del servidor');
      }

      final success = data['success'] == true;
      final userMap = data['user'];

      if (!success || userMap is! Map<String, dynamic>) {
        throw AuthUnauthorizedException(
          (data['message'] as String?) ?? 'Error al iniciar sesión',
        );
      }

      return User.fromJson(userMap);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw AuthUnauthorizedException(
          _messageFromResponse(e.response) ?? 'Credenciales incorrectas',
        );
      }
      if (e.response?.statusCode == 403) {
        throw AuthForbiddenException(
          _messageFromResponse(e.response) ?? 'Acceso denegado',
        );
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        throw AuthUnauthorizedException(
          'Tiempo de espera agotado. Verifica la URL del servidor y que esté encendido.',
        );
      }
      if (e.type == DioExceptionType.connectionError) {
        throw AuthUnauthorizedException(
          'No se pudo conectar al servidor. Revisa la red y la URL.',
        );
      }
      rethrow;
    }
  }

  String? _messageFromResponse(Response<dynamic>? response) {
    if (response?.data is Map && response!.data['message'] != null) {
      return response.data['message'] as String;
    }
    return null;
  }

  /// Cierra sesión en el servidor (POST /api/logout) y limpia cookies locales.
  Future<void> logout() async {
    try {
      await _dio.post('/api/logout');
    } catch (_) {}
    await _cookieJar.deleteAll();
  }

  /// Comprueba si hay cookie de sesión guardada (útil para “recordar sesión”).
  Future<bool> hasStoredSession() async {
    final uri = Uri.parse(_baseUrl);
    final cookies = await _cookieJar.loadForRequest(uri);
    return cookies.any((c) => c.name == _cookieName);
  }
}
