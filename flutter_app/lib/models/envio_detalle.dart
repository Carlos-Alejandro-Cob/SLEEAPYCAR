import 'producto.dart';

class EnvioDetalle {
  final int id;
  final String codigo;
  final String destinatario;
  final String direccion;
  final String estado;
  final List<Producto> productos;
  final int totalProductos;

  EnvioDetalle({
    required this.id,
    required this.codigo,
    required this.destinatario,
    required this.direccion,
    required this.estado,
    required this.productos,
    required this.totalProductos,
  });

  factory EnvioDetalle.fromJson(Map<String, dynamic> json) {
    final productosList = (json['productos'] as List<dynamic>?)
            ?.map((p) => Producto.fromJson(p as Map<String, dynamic>))
            .toList() ??
        [];

    return EnvioDetalle(
      id: json['envio']['id'] ?? 0,
      codigo: json['envio']['codigo'] ?? '',
      destinatario: json['envio']['destinatario'] ?? '',
      direccion: json['envio']['direccion'] ?? '',
      estado: json['envio']['estado'] ?? '',
      productos: productosList,
      totalProductos: json['totalProductos'] ?? 0,
    );
  }

  int get totalEntregado => productos.fold(0, (sum, p) => sum + p.entregado);
  bool get estaCompletado => totalEntregado >= totalProductos;
}
