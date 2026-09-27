import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'api.dart';
import 'config.dart';
import 'session.dart';
import 'tracking.dart';

class HomePage extends StatefulWidget {
  const HomePage({
    super.key,
    required this.driverId,
    required this.token,
    required this.name,
    required this.onLogout,
  });

  final String driverId;
  final String token;
  final String name;
  final Future<void> Function() onLogout;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _map = MapController();
  final _alerts = FlutterLocalNotificationsPlugin();
  io.Socket? _socket;
  LatLng _me = const LatLng(kCaroraLat, kCaroraLng);
  var _online = false;
  var _active = false;
  var _busy = false;
  String? _error;
  Map<String, dynamic>? _offer;
  int _left = 0;
  Timer? _ticker;
  Map<String, dynamic>? _trip;
  String? _paymentRef;

  DriverApi get _api => DriverApi(token: widget.token);

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    await _alerts.initialize(const InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    ));
    const channel = AndroidNotificationChannel(
      'rapidez_offers',
      'Ofertas Rapidez',
      description: 'Carreras nuevas',
      importance: Importance.max,
      playSound: true,
    );
    await _alerts
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
    await _refreshMe();
    _connectSocket();
    _online = await Session.tracking();
    if (_online) await startTracking();
    if (mounted) setState(() {});
  }

  Future<void> _refreshMe() async {
    try {
      final me = await _api.me();
      _active = me['isActive'] == true;
      _error = null;
    } on ApiException catch (error) {
      _error = error.message;
    }
    if (mounted) setState(() {});
  }

  void _connectSocket() {
    _socket?.dispose();
    final socket = io.io(
      kApiBase,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableReconnection()
          .disableAutoConnect()
          .build(),
    );
    socket.connect();
    socket.onConnect((_) {
      socket.emit('join_room', {
        'userId': widget.driverId,
        'role': 'driver',
        'token': widget.token,
      });
    });
    socket.on('trip_offer', (data) {
      if (data is Map && _trip == null && _offer == null) {
        _showOffer(Map<String, dynamic>.from(data));
      }
    });
    socket.on('payment_reported', (data) {
      if (data is Map && mounted) {
        setState(() => _paymentRef = data['referenceCode']?.toString());
      }
    });
    socket.on('trip_status_changed', (data) {
      if (data is Map && data['status'] == 'CANCELLED' && mounted) {
        setState(() {
          _trip = null;
          _paymentRef = null;
        });
        Session.setTrip(null);
      }
    });
    _socket = socket;
  }

  Future<void> _showOffer(Map<String, dynamic> offer) async {
    final seconds = (offer['expiresInSec'] as num?)?.toInt() ?? 15;
    await _alerts.show(
      77,
      'Nueva carrera en Carora',
      '${offer['origin']?['reference'] ?? 'Punto de recogida'} · \$${offer['fareUsd']}',
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'rapidez_offers',
          'Ofertas Rapidez',
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          category: AndroidNotificationCategory.call,
        ),
      ),
    );
    SystemSound.play(SystemSoundType.alert);
    _ticker?.cancel();
    setState(() {
      _offer = offer;
      _left = seconds;
    });
    _ticker = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_left <= 1) {
        timer.cancel();
        if (mounted) setState(() => _offer = null);
        return;
      }
      if (mounted) setState(() => _left -= 1);
    });
  }

  Future<void> _toggle(bool value) async {
    if (!_active) {
      setState(() => _error = 'Tu cuenta sigue pendiente. Envía las fotos por WhatsApp y pulsa actualizar.');
      return;
    }
    setState(() => _busy = true);
    try {
      if (value) {
        final fine = await Permission.location.request();
        if (!fine.isGranted) {
          throw ApiException('Activa la ubicación para ponerte en línea.');
        }
        await Permission.locationAlways.request();
        await Permission.notification.request();
        final serviceOn = await Geolocator.isLocationServiceEnabled();
        if (!serviceOn) throw ApiException('Enciende el GPS del teléfono.');
        await _api.setAvailable(true);
        await Session.setTracking(true);
        await startTracking();
        final pos = await Geolocator.getCurrentPosition();
        _me = LatLng(pos.latitude, pos.longitude);
        try {
          _map.move(_me, 16);
        } catch (_) {}
      } else {
        await Session.setTracking(false);
        await stopTracking();
        await _api.setAvailable(false);
      }
      _online = value;
      _error = null;
    } on ApiException catch (error) {
      _error = error.message;
      _online = false;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _accept() async {
    final offer = _offer;
    if (offer == null) return;
    final id = offer['id']?.toString();
    if (id == null) return;
    setState(() => _busy = true);
    try {
      final result = await _api.accept(id);
      _ticker?.cancel();
      final trip = result['trip'];
      await Session.setTrip(id);
      setState(() {
        _offer = null;
        _trip = trip is Map ? Map<String, dynamic>.from(trip) : {'id': id, 'status': 'ACCEPTED'};
      });
    } on ApiException catch (error) {
      _ticker?.cancel();
      setState(() {
        _offer = null;
        _error = error.message;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _advance(String status) async {
    final id = _trip?['id']?.toString();
    if (id == null) return;
    setState(() => _busy = true);
    try {
      final result = await _api.setStatus(id, status);
      final trip = result['trip'];
      if (status == 'COMPLETED' || status == 'CANCELLED') {
        await Session.setTrip(null);
        setState(() {
          _trip = null;
          _paymentRef = null;
        });
      } else if (trip is Map) {
        setState(() => _trip = Map<String, dynamic>.from(trip));
      }
      _error = null;
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _socket?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final trip = _trip;
    final status = trip?['status']?.toString();
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.name.isEmpty ? 'Rapidez' : widget.name),
        actions: [
          IconButton(onPressed: _refreshMe, icon: const Icon(Icons.refresh)),
          IconButton(onPressed: widget.onLogout, icon: const Icon(Icons.logout)),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: FlutterMap(
              mapController: _map,
              options: MapOptions(initialCenter: _me, initialZoom: 15),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 've.rapidez.carora.driver',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _me,
                      width: 40,
                      height: 40,
                      child: const Icon(Icons.two_wheeler, color: Colors.black, size: 36),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Material(
            elevation: 8,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(_active ? 'Cuenta activa' : 'Esperando activación'),
                      ),
                      const Text('En línea'),
                      Switch(value: _online, onChanged: _busy ? null : _toggle),
                    ],
                  ),
                  if (!_active)
                    const Text('Cuando el administrador te active, pulsa el ícono de actualizar y enciende En línea.'),
                  if (_error != null)
                    Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                  if (trip != null) ...[
                    Text('Carrera $status', style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(trip['origin']?['reference']?.toString() ?? ''),
                    if (_paymentRef != null) Text('Pago Móvil ref: $_paymentRef'),
                    const SizedBox(height: 8),
                    if (status == 'ACCEPTED')
                      FilledButton(onPressed: _busy ? null : () => _advance('DRIVER_ARRIVED'), child: const Text('YA LLEGUÉ')),
                    if (status == 'DRIVER_ARRIVED')
                      FilledButton(onPressed: _busy ? null : () => _advance('IN_PROGRESS'), child: const Text('INICIAR VIAJE')),
                    if (status == 'IN_PROGRESS' && _paymentRef != null)
                      FilledButton(
                        onPressed: _busy
                            ? null
                            : () async {
                                await _api.confirmPayment(trip['id'].toString(), paid: true);
                                if (mounted) setState(() => _paymentRef = '$_paymentRef · confirmado');
                              },
                        child: const Text('CONFIRMAR PAGO MÓVIL'),
                      ),
                    if (status == 'IN_PROGRESS')
                      FilledButton(onPressed: _busy ? null : () => _advance('COMPLETED'), child: const Text('FINALIZAR')),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: _offer == null
          ? null
          : SafeArea(
              child: Material(
                color: const Color(0xFF1A1A1A),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Nueva carrera · $_left s', style: const TextStyle(color: Color(0xFFF5B400), fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Text(
                        '${_offer!['origin']?['reference'] ?? ''} → ${_offer!['destination']?['address'] ?? ''}',
                        style: const TextStyle(color: Colors.white),
                      ),
                      Text(
                        '\$${_offer!['fareUsd']} · ${_offer!['paymentMethod']}',
                        style: const TextStyle(color: Colors.white70),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                _ticker?.cancel();
                                setState(() => _offer = null);
                              },
                              child: const Text('RECHAZAR'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: FilledButton(
                              onPressed: _busy ? null : _accept,
                              child: const Text('ACEPTAR'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
