import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../models/envio_detalle.dart';
import '../models/producto.dart';
import '../services/api_service.dart';

class EnvioDetalleScreen extends StatefulWidget {
  final int envioId;

  const EnvioDetalleScreen({
    super.key,
    required this.envioId,
  });

  @override
  State<EnvioDetalleScreen> createState() => _EnvioDetalleScreenState();
}

class _EnvioDetalleScreenState extends State<EnvioDetalleScreen> {
  final ApiService _apiService = ApiService();
  EnvioDetalle? _envioDetalle;
  bool _isLoading = true;
  String? _error;
  final TextEditingController _codigoController = TextEditingController();
  bool _showScanner = false;
  final MobileScannerController _scannerController = MobileScannerController();

  @override
  void initState() {
    super.initState();
    _loadDetalle();
  }

  @override
  void dispose() {
    _codigoController.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _loadDetalle() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final detalle = await _apiService.getEnvioDetalle(widget.envioId);
      setState(() {
        _envioDetalle = detalle;
        _isLoading = false;
      });
      // Cargar estado actualizado
      _loadEstado();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadEstado() async {
    try {
      final estado = await _apiService.getEstadoProductos(widget.envioId);
      if (estado['success'] == true && mounted) {
        final productosList = (estado['productos'] as List<dynamic>)
            .map((p) => Producto.fromJson(p as Map<String, dynamic>))
            .toList();

        setState(() {
          if (_envioDetalle != null) {
            _envioDetalle = EnvioDetalle(
              id: _envioDetalle!.id,
              codigo: _envioDetalle!.codigo,
              destinatario: _envioDetalle!.destinatario,
              direccion: _envioDetalle!.direccion,
              estado: _envioDetalle!.estado,
              productos: productosList,
              totalProductos: _envioDetalle!.totalProductos,
            );
          }
        });
      }
    } catch (e) {
      // Ignorar errores al cargar estado
    }
  }

  Future<void> _buscarYMarcarProducto(String codigo) async {
    if (codigo.isEmpty || _envioDetalle == null) return;

    try {
      // Buscar producto
      final producto = await _apiService.buscarProducto(
        codigo,
        _envioDetalle!.id,
      );

      // Marcar como entregado
      await _apiService.marcarProductoEntregado(
        _envioDetalle!.id,
        producto.idProducto,
      );

      // Recargar estado
      await _loadEstado();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✓ ${producto.descripcion} marcado como entregado'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }

      _codigoController.clear();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll("Exception: ", "")}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _toggleScanner() {
    setState(() {
      _showScanner = !_showScanner;
      if (!_showScanner) {
        _scannerController.stop();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de Envío'),
        actions: [
          IconButton(
            icon: Icon(_showScanner ? Icons.close : Icons.qr_code_scanner),
            onPressed: _toggleScanner,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(
                        'Error: $_error',
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadDetalle,
                        child: const Text('Reintentar'),
                      ),
                    ],
                  ),
                )
              : _envioDetalle == null
                  ? const Center(child: Text('No se pudo cargar el envío'))
                  : Column(
                      children: [
                        // Información del envío
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          color: Theme.of(context).primaryColor.withOpacity(0.1),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Código: ${_envioDetalle!.codigo}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Destinatario: ${_envioDetalle!.destinatario}',
                                style: const TextStyle(fontSize: 14),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Dirección: ${_envioDetalle!.direccion}',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Total de productos
                        Container(
                          width: double.infinity,
                          margin: const EdgeInsets.all(16),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Theme.of(context).primaryColor,
                                Theme.of(context).colorScheme.secondary,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            children: [
                              const Text(
                                'Total de Productos',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${_envioDetalle!.totalEntregado} / ${_envioDetalle!.totalProductos}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${_envioDetalle!.totalProductos - _envioDetalle!.totalEntregado} pendiente(s)',
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Escáner o Input de código
                        if (_showScanner)
                          Container(
                            height: 300,
                            margin: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: MobileScanner(
                                controller: _scannerController,
                                onDetect: (capture) {
                                  final List<Barcode> barcodes =
                                      capture.barcodes;
                                  for (final barcode in barcodes) {
                                    if (barcode.rawValue != null) {
                                      _buscarYMarcarProducto(barcode.rawValue!);
                                      _toggleScanner();
                                      break;
                                    }
                                  }
                                },
                              ),
                            ),
                          )
                        else
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: TextField(
                              controller: _codigoController,
                              decoration: InputDecoration(
                                labelText: 'Escanear o Ingresar Código',
                                hintText: 'Ingrese código del producto',
                                prefixIcon: const Icon(Icons.qr_code),
                                suffixIcon: IconButton(
                                  icon: const Icon(Icons.search),
                                  onPressed: () {
                                    _buscarYMarcarProducto(
                                      _codigoController.text,
                                    );
                                  },
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              textInputAction: TextInputAction.done,
                              onSubmitted: _buscarYMarcarProducto,
                              autofocus: true,
                            ),
                          ),

                        // Lista de productos
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _envioDetalle!.productos.length,
                            itemBuilder: (context, index) {
                              final producto = _envioDetalle!.productos[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              producto.descripcion,
                                              style: const TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                          Container(
                                            padding:
                                                const EdgeInsets.symmetric(
                                              horizontal: 12,
                                              vertical: 6,
                                            ),
                                            decoration: BoxDecoration(
                                              color: producto.estaCompletado
                                                  ? Colors.green.withOpacity(0.2)
                                                  : Colors.orange
                                                      .withOpacity(0.2),
                                              borderRadius:
                                                  BorderRadius.circular(20),
                                            ),
                                            child: Text(
                                              producto.estaCompletado
                                                  ? 'Completado'
                                                  : 'Pendiente',
                                              style: TextStyle(
                                                color: producto.estaCompletado
                                                    ? Colors.green
                                                    : Colors.orange,
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            '${producto.entregado} / ${producto.cantidad}',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: Theme.of(context)
                                                  .primaryColor,
                                            ),
                                          ),
                                          Text(
                                            '${producto.pendiente} pendiente(s)',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey[600],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      LinearProgressIndicator(
                                        value: producto.porcentajeCompletado,
                                        backgroundColor: Colors.grey[200],
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                          producto.estaCompletado
                                              ? Colors.green
                                              : Theme.of(context).primaryColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
    );
  }
}
