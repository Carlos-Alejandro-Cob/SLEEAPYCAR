/// Modelo de envío alineado con la tabla `envios` y respuesta del API móvil.
class Envio {
  final int id;
  final String codigoEnvio;
  final String nombreDestinatario;
  final String direccionCompleta;
  final String estadoEnvio;
  final String? metodoPago;
  final double? precio;
  final String? estadoPago;
  final int? idRepartidor;
  final List<EnvioProducto>? products;

  const Envio({
    required this.id,
    required this.codigoEnvio,
    required this.nombreDestinatario,
    required this.direccionCompleta,
    required this.estadoEnvio,
    this.metodoPago,
    this.precio,
    this.estadoPago,
    this.idRepartidor,
    this.products,
  });

  factory Envio.fromJson(Map<String, dynamic> json) {
    List<EnvioProducto>? products;
    if (json['products'] != null) {
      products = (json['products'] as List<dynamic>)
          .map((e) => EnvioProducto.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    return Envio(
      id: (json['_id'] ?? json['id_envio'] ?? json['id'] ?? 0) as int,
      codigoEnvio: (json['ID_Envio'] ?? json['codigo_envio'] ?? '') as String,
      nombreDestinatario:
          (json['Nombre_Destinatario'] ?? json['nombre_destinatario'] ?? '') as String,
      direccionCompleta:
          (json['Direccion_Completa'] ?? json['direccion_completa'] ?? '') as String,
      estadoEnvio: (json['Estado_Envio'] ?? json['estado_envio'] ?? '') as String,
      metodoPago: json['metodo_pago'] as String?,
      precio: _toDouble(json['precio']),
      estadoPago: json['estado_pago'] as String?,
      idRepartidor: json['id_repartidor'] as int?,
      products: products,
    );
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }
}

class EnvioProducto {
  final int idProducto;
  final int cantidad;
  final String? descripcion;

  const EnvioProducto({
    required this.idProducto,
    required this.cantidad,
    this.descripcion,
  });

  factory EnvioProducto.fromJson(Map<String, dynamic> json) {
    return EnvioProducto(
      idProducto: (json['id_producto_fk'] ?? json['id_producto'] ?? 0) as int,
      cantidad: (json['cantidad'] ?? 0) as int,
      descripcion: json['descripcion'] as String?,
    );
  }
}
