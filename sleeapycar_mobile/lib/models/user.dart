/// Modelo de usuario alineado con la tabla `usuarios` y respuesta del API.
/// Roles: Bodeguero (2), Repartidor (3).
class User {
  final int id;
  final String nombreCompleto;
  final String nombreUsuario;
  final String? email;
  final String? direccion;
  final int idRol;

  const User({
    required this.id,
    required this.nombreCompleto,
    required this.nombreUsuario,
    this.email,
    this.direccion,
    required this.idRol,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['id'] ?? json['id_usuario'] ?? 0) as int,
      nombreCompleto: (json['nombre'] ?? json['nombre_completo'] ?? '') as String,
      nombreUsuario: (json['username'] ?? json['nombre_usuario'] ?? '') as String,
      email: json['email'] as String?,
      direccion: json['direccion'] as String?,
      idRol: (json['rol'] ?? json['id_rol_fk'] ?? 0) as int,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nombre_completo': nombreCompleto,
        'nombre_usuario': nombreUsuario,
        'email': email,
        'direccion': direccion,
        'id_rol_fk': idRol,
      };

  bool get isBodeguero => idRol == 2;
  bool get isRepartidor => idRol == 3;
  bool get isSuperAdmin => idRol == 6;
}
