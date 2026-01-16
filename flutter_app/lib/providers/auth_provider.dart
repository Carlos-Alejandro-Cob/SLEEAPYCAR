import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  bool _isAuthenticated = false;
  String? _username;
  String? _userName;

  bool get isAuthenticated => _isAuthenticated;
  String? get username => _username;
  String? get userName => _userName;

  String? _lastError;
  String? get lastError => _lastError;

  Future<bool> login(String username, String password) async {
    try {
      _lastError = null;
      final result = await _authService.login(username, password);
      if (result['success'] == true) {
        _isAuthenticated = true;
        _username = await _authService.getUsername();
        _userName = await _authService.getUserName();
        notifyListeners();
        return true;
      } else {
        _lastError = result['message'] ?? 'Error al iniciar sesión';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _lastError = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _isAuthenticated = false;
    _username = null;
    _userName = null;
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    _isAuthenticated = await _authService.isLoggedIn();
    if (_isAuthenticated) {
      _username = await _authService.getUsername();
      _userName = await _authService.getUserName();
    }
    notifyListeners();
  }
}
