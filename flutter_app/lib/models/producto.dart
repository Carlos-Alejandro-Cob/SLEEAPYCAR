class Producto {
  final int idProducto;
  final String descripcion;
  final int cantidad;
  final int entregado;
  final int pendiente;

  Producto({
    required this.idProducto,
    required this.descripcion,
    required this.cantidad,
    this.entregado = 0,
    this.pendiente = 0,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    final cantidad = json['cantidad'] is int 
        ? json['cantidad'] 
        : int.tryParse(json['cantidad'].toString()) ?? 0;
    
    final entregado = json['entregado'] ?? 0;
    final pendiente = json['pendiente'] ?? (cantidad - entregado);

    return Producto(
      idProducto: json['id_producto_fk'] ?? json['id_producto'] ?? 0,
      descripcion: json['descripcion'] ?? '',
      cantidad: cantidad,
      entregado: entregado is int ? entregado : int.tryParse(entregado.toString()) ?? 0,
      pendiente: pendiente is int ? pendiente : int.tryParse(pendiente.toString()) ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_producto_fk': idProducto,
      'descripcion': descripcion,
      'cantidad': cantidad,
      'entregado': entregado,
      'pendiente': pendiente,
    };
  }

  bool get estaCompletado => entregado >= cantidad;
  double get porcentajeCompletado => cantidad > 0 ? (entregado / cantidad) : 0.0;
}
