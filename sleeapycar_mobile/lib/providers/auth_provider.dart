import 'package:flutter/foundation.dart';

import '../data/auth_service.dart';
import '../models/user.dart';

/// Estado de autenticación para la UI.
enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

/// Mensaje de error mostrable en la UI.
class AuthError {
  final String message;
  final bool isForbidden;

  AuthError(this.message, {this.isForbidden = false});
}

/// Provider que gestiona sesión y usuario actual.
class AuthProvider with ChangeNotifier {
  AuthProvider({AuthService? authService})
      : _authService = authService ?? AuthService();

  final AuthService _authService;

  AuthStatus _status = AuthStatus.initial;
  User? _user;
  AuthError? _error;

  AuthStatus get status => _status;
  User? get user => _user;
  AuthError? get error => _error;
  bool get isAuthenticated => _status == AuthStatus.authenticated && _user != null;

  AuthService get authService => _authService;

  /// Configura la URL base del backend (ej. al iniciar con IP del hotspot).
  void setBaseUrl(String url) {
    _authService.setBaseUrl(url);
    notifyListeners();
  }

  /// Login con nombre de usuario y contraseña.
  Future<bool> login(String nombreUsuario, String password) async {
    _status = AuthStatus.loading;
    _error = null;
    notifyListeners();

    try {
      _user = await _authService.login(nombreUsuario, password);
      _status = AuthStatus.authenticated;
      _error = null;
      notifyListeners();
      return true;
    } on AuthUnauthorizedException catch (e) {
      _status = AuthStatus.error;
      _error = AuthError(e.message, isForbidden: false);
      _user = null;
      notifyListeners();
      return false;
    } on AuthForbiddenException catch (e) {
      _status = AuthStatus.error;
      _error = AuthError(e.message, isForbidden: true);
      _user = null;
      notifyListeners();
      return false;
    } catch (e) {
      _status = AuthStatus.error;
      _error = AuthError(e.toString(), isForbidden: false);
      _user = null;
      notifyListeners();
      return false;
    }
  }

  /// Cierra sesión y limpia cookies.
  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _status = AuthStatus.unauthenticated;
    _error = null;
    notifyListeners();
  }

  /// Limpia el mensaje de error (para que la UI no lo muestre de forma persistente).
  void clearError() {
    _error = null;
    if (_status == AuthStatus.error) _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  /// Comprueba si hay sesión guardada (cookie persistente).
  Future<bool> hasStoredSession() => _authService.hasStoredSession();
}
