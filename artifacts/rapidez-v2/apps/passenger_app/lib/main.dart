import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'alerts.dart';
import 'api.dart';
import 'ride_page.dart';

@pragma('vm:entry-point')
Future<void> firebaseBackground(RemoteMessage message) async {
  await Firebase.initializeApp();
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await alerts.initialize(const InitializationSettings(
    android: AndroidInitializationSettings('@mipmap/ic_launcher'),
  ));
  const channel = AndroidNotificationChannel(
    'rapidez_alerts',
    'Avisos Rapidez',
    description: 'La moto está cerca',
    importance: Importance.max,
    playSound: true,
  );
  await alerts
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);
  runApp(const RapidezPassengerApp());
}

class RapidezPassengerApp extends StatelessWidget {
  const RapidezPassengerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rapidez',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFF5B400)),
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
  final _name = TextEditingController();
  final _phone = TextEditingController();
  String? _id;
  String? _token;
  var _ready = false;
  var _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _id = prefs.getString('passengerId');
      _token = prefs.getString('passengerToken');
      _ready = true;
    });
    if (_token != null) await _hookPush(_token!);
  }

  Future<void> _hookPush(String token) async {
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseBackground);
      await FirebaseMessaging.instance.requestPermission();
      final fcm = await FirebaseMessaging.instance.getToken();
      if (fcm != null) await PassengerApi(token: token).saveFcm(fcm);
      FirebaseMessaging.onMessage.listen((message) async {
        final n = message.notification;
        if (n == null) return;
        await alerts.show(
          41,
          n.title,
          n.body,
          const NotificationDetails(
            android: AndroidNotificationDetails(
              'rapidez_alerts',
              'Avisos Rapidez',
              importance: Importance.max,
              priority: Priority.high,
              playSound: true,
            ),
          ),
        );
      });
    } catch (_) {
      // Sin google-services.json el push queda apagado. El socket sigue avisando con la app abierta.
    }
  }

  Future<void> _register() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final result = await PassengerApi().register(_name.text.trim(), _phone.text.trim());
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('passengerId', result['id'].toString());
      await prefs.setString('passengerToken', result['accessToken'].toString());
      await _load();
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_id != null && _token != null) {
      return RidePage(passengerId: _id!, token: _token!);
    }
    return Scaffold(
      appBar: AppBar(title: const Text('Rapidez Carora')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Tu nombre y teléfono quedan en este teléfono. No hace falta contraseña.'),
          const SizedBox(height: 12),
          TextField(controller: _name, decoration: const InputDecoration(labelText: 'Nombre')),
          const SizedBox(height: 8),
          TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Teléfono', hintText: '0414…')),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 16),
          FilledButton(onPressed: _busy ? null : _register, child: const Text('ENTRAR')),
        ],
      ),
    );
  }
}
