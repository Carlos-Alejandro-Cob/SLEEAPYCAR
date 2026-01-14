class Envio {
  final int id;
  final String codigo;
  final String destinatario;
  final String direccion;
  final String estado;

  Envio({
    required this.id,
    required this.codigo,
    required this.destinatario,
    required this.direccion,
    required this.estado,
  });

  factory Envio.fromJson(Map<String, dynamic> json) {
    return Envio(
      id: json['_id'] ?? json['id'],
      codigo: json['ID_Envio'] ?? json['codigo'] ?? '',
      destinatario: json['Nombre_Destinatario'] ?? json['destinatario'] ?? '',
      direccion: json['Direccion_Completa'] ?? json['direccion'] ?? '',
      estado: json['Estado_Envio'] ?? json['estado'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'codigo': codigo,
      'destinatario': destinatario,
      'direccion': direccion,
      'estado': estado,
    };
  }
}
