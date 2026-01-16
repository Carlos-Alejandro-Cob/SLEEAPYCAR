import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/envio.dart';
import '../models/envio_detalle.dart';
import '../models/producto.dart';

class ApiService {
  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Cambiar esta URL por la de tu servidor
  // Para Android Emulator: http://10.0.2.2:3001/mobile/api
  // Para iOS Simulator: http://localhost:3001/mobile/api
  // Para dispositivo físico Android/iOS: http://TU_IP_LOCAL:3001/mobile/api
  // Ejemplo con IP local: http://192.168.1.100:3001/mobile/api
  // IP local detectada: 10.3.1.134
  static const String baseUrl = 'http://10.3.1.134:3001/mobile/api';
  
  // Cliente HTTP con soporte de cookies
  final http.Client _client = http.Client();
  
  // Cookie de sesión para mantener la autenticación
  String? _sessionCookie;
  static const String _cookieKey = 'session_cookie';
  
  String? get sessionCookie => _sessionCookie;
  
  // Cargar cookie desde SharedPreferences
  Future<void> _loadCookie() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _sessionCookie = prefs.getString(_cookieKey);
      if (_sessionCookie != null) {
        print('Cookie cargada desde almacenamiento: $_sessionCookie');
      }
    } catch (e) {
      print('Error al cargar cookie: $e');
    }
  }
  
  // Guardar cookie en SharedPreferences
  Future<void> _persistCookie(String cookie) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_cookieKey, cookie);
      _sessionCookie = cookie;
      print('Cookie guardada en almacenamiento: $cookie');
    } catch (e) {
      print('Error al guardar cookie: $e');
    }
  }
  
  // Limpiar cookie
  Future<void> _clearCookie() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_cookieKey);
      _sessionCookie = null;
    } catch (e) {
      print('Error al limpiar cookie: $e');
    }
  }

  // Headers comunes
  Map<String, String> get headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (_sessionCookie != null && _sessionCookie!.isNotEmpty) {
      headers['Cookie'] = _sessionCookie!;
    }
    return headers;
  }

  // Guardar cookie de sesión desde la respuesta
  Future<void> _saveCookie(http.Response response) async {
    // Buscar cookie en diferentes formatos de header
    String? cookieHeader = response.headers['set-cookie'];
    if (cookieHeader == null) {
      cookieHeader = response.headers['Set-Cookie'];
    }
    
    if (cookieHeader != null && cookieHeader.isNotEmpty) {
      // Express session usa connect.sid como nombre de cookie
      // Buscar específicamente esta cookie
      String cookieValue = '';
      
      // Si hay múltiples cookies, buscar connect.sid específicamente
      List<String> cookies = cookieHeader.split(',');
      for (String cookie in cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith('connect.sid=')) {
          // Extraer solo el nombre=valor (antes del primer punto y coma)
          cookieValue = cookie.split(';').first.trim();
          break;
        }
      }
      
      // Si no se encontró connect.sid, tomar la primera cookie
      if (cookieValue.isEmpty && cookies.isNotEmpty) {
        cookieValue = cookies.first.trim().split(';').first.trim();
      }
      
      if (cookieValue.isNotEmpty) {
        await _persistCookie(cookieValue);
      }
    }
  }

  // Login
  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final url = '$baseUrl/login';
      await _loadCookie();
      
      final body = 'nombre_usuario=$username&password=$password';
      print('Enviando login a: $url');
      print('Body: nombre_usuario=$username&password=***');
      
      final urlUri = Uri.parse(url);
      final response = await _client.post(
        urlUri,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de espera agotado. Verifica que el servidor esté corriendo y la URL sea correcta.');
        },
      );

      print('Status code: ${response.statusCode}');
      print('Response body: ${response.body}');

      await _saveCookie(response);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        try {
          final error = json.decode(response.body);
          throw Exception(error['message'] ?? 'Error al iniciar sesión');
        } catch (e) {
          throw Exception('Error ${response.statusCode}: ${response.body}');
        }
      }
    } catch (e) {
      print('Error en login: $e');
      if (e.toString().contains('Failed host lookup') || e.toString().contains('Connection refused')) {
        throw Exception('No se pudo conectar al servidor. Verifica que:\n1. El servidor esté corriendo en el puerto 3001\n2. Si usas dispositivo físico, cambia la URL a tu IP local (ej: http://192.168.1.100:3001/mobile/api)');
      }
      throw Exception('Error de conexión: $e');
    }
  }

  // Logout
  Future<bool> logout() async {
    try {
      final url = '$baseUrl/logout';
      await _loadCookie();
      
      final urlUri = Uri.parse(url);
      final response = await _client.post(
        urlUri,
        headers: headers,
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          return http.Response('Timeout', 408);
        },
      );

      if (response.statusCode == 200) {
        await _clearCookie();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Obtener lista de envíos
  Future<List<Envio>> getEnvios() async {
    try {
      final url = '$baseUrl/envios';
      await _loadCookie();
      
      final urlUri = Uri.parse(url);
      final response = await _client.get(urlUri, headers: headers).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de espera agotado');
        },
      );
      
      await _saveCookie(response);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final enviosList = (data['envios'] as List<dynamic>)
              .map((e) => Envio.fromJson(e as Map<String, dynamic>))
              .toList();
          return enviosList;
        } else {
          throw Exception(data['message'] ?? 'Error al obtener envíos');
        }
      } else if (response.statusCode == 401) {
        throw Exception('Sesión expirada. Por favor, inicia sesión nuevamente');
      } else {
        throw Exception('Error ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error al obtener envíos: $e');
    }
  }

  // Obtener detalle de envío
  Future<EnvioDetalle> getEnvioDetalle(int id) async {
    try {
      final url = '$baseUrl/envio/$id';
      await _loadCookie();
      
      final urlUri = Uri.parse(url);
      final response = await _client.get(urlUri, headers: headers).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de espera agotado');
        },
      );
      
      await _saveCookie(response);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return EnvioDetalle.fromJson(data);
        } else {
          throw Exception(data['message'] ?? 'Error al obtener detalle');
        }
      } else {
        throw Exception('Error ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error al obtener detalle: $e');
    }
  }

  // Buscar producto por código
  Future<Producto> buscarProducto(String codigo, int idEnvio) async {
    try {
      final url = '$baseUrl/producto/buscar';
      final bodyData = json.encode({
        'codigo': codigo,
        'id_envio': idEnvio,
      });
      
      await _loadCookie();
      
      final urlUri = Uri.parse(url);
      final response = await _client.post(
        urlUri,
        headers: headers,
        body: bodyData,
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de espera agotado');
        },
      );
      
      await _saveCookie(response);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return Producto.fromJson(data['producto']);
        } else {
          throw Exception(data['message'] ?? 'Producto no encontrado');
        }
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Error al buscar producto');
      }
    } catch (e) {
      throw Exception('Error al buscar producto: $e');
    }
  }

  // Marcar producto como entregado
  Future<Map<String, dynamic>> marcarProductoEntregado(
      int idEnvio, int idProducto) async {
    try {
      final url = '$baseUrl/producto/entregar';
      final bodyData = json.encode({
        'id_envio': idEnvio,
        'id_producto': idProducto,
      });
      
      await _loadCookie();
      
      final urlUri = Uri.parse(url);
      final response = await _client.post(
        urlUri,
        headers: headers,
        body: bodyData,
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de espera agotado');
        },
      );
      
      await _saveCookie(response);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Error al marcar producto');
      }
    } catch (e) {
      throw Exception('Error al marcar producto: $e');
    }
  }

  // Obtener estado de productos
  Future<Map<String, dynamic>> getEstadoProductos(int idEnvio) async {
    try {
      final url = '$baseUrl/envio/$idEnvio/estado';
      await _loadCookie();
      
      final urlUri = Uri.parse(url);
      final response = await _client.get(urlUri, headers: headers).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de espera agotado');
        },
      );
      
      await _saveCookie(response);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Error al obtener estado');
      }
    } catch (e) {
      throw Exception('Error al obtener estado: $e');
    }
  }

  // Cerrar cliente HTTP
  void close() {
    _client.close();
  }
}
