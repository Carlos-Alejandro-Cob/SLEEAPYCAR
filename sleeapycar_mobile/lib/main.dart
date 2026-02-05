import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'data/auth_service.dart';
import 'providers/auth_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Persistir cookie connect.sid entre sesiones
  final cookieJar = await AuthService.initCookieJar();
  final authService = AuthService();
  authService.setCookieJar(cookieJar);

  runApp(
    ChangeNotifierProvider<AuthProvider>(
      create: (_) => AuthProvider(authService: authService),
      child: const SleeaApycarApp(),
    ),
  );
}

class SleeaApycarApp extends StatelessWidget {
  const SleeaApycarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SLEE APYCAR',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      initialRoute: '/login',
      routes: {
        '/login': (_) => const LoginScreen(),
        '/home': (_) => const HomeScreen(),
      },
    );
  }
}
