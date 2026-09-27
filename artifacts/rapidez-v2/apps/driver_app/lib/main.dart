import 'package:flutter/material.dart';

import 'home_page.dart';
import 'register_page.dart';
import 'session.dart';
import 'tracking.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeTrackingService();
  runApp(const RapidezDriverApp());
}

class RapidezDriverApp extends StatelessWidget {
  const RapidezDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rapidez Conductor',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFF5B400), brightness: Brightness.light),
        useMaterial3: true,
        inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
      ),
      home: const Gate(),
    );
  }
}

class Gate extends StatefulWidget {
  const Gate({super.key});

  @override
  State<Gate> createState() => _GateState();
}

class _GateState extends State<Gate> {
  Map<String, String>? _session;
  var _ready = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final session = await Session.read();
    if (!mounted) return;
    setState(() {
      _session = session;
      _ready = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final session = _session;
    if (session == null) {
      return RegisterPage(onDone: _load);
    }
    return HomePage(
      driverId: session['id']!,
      token: session['token']!,
      name: session['name'] ?? '',
      onLogout: () async {
        await stopTracking();
        await Session.clear();
        await _load();
      },
    );
  }
}
