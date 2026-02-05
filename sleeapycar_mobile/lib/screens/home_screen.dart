import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';

/// Pantalla principal tras el login (Repartidor/Bodeguero).
/// Placeholder: luego se puede mostrar lista de envíos u opciones por rol.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return Scaffold(
      appBar: AppBar(
        title: const Text('SLEE APYCAR'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.check_circle_outline_rounded,
                size: 80,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(height: 24),
              Text(
                'Bienvenido',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              if (user != null) ...[
                const SizedBox(height: 8),
                Text(
                  user.nombreCompleto,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                Text(
                  '@${user.nombreUsuario}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
                const SizedBox(height: 8),
                Chip(
                  label: Text(
                    user.isRepartidor
                        ? 'Repartidor'
                        : user.isBodeguero
                            ? 'Bodeguero'
                            : 'Rol ${user.idRol}',
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
