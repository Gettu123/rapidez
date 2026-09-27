import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'alerts.dart';
import 'api.dart';
import 'config.dart';
import 'places.dart';

class RidePage extends StatefulWidget {
  const RidePage({super.key, required this.passengerId, required this.token});
  final String passengerId;
  final String token;

  @override
  State<RidePage> createState() => _RidePageState();
}

class _RidePageState extends State<RidePage> {
  final _map = MapController();
  final _reference = TextEditingController();
  final _destReference = TextEditingController();
  LatLng _center = const LatLng(kCaroraLat, kCaroraLng);
  LatLng? _pickup;
  LatLng? _dropoff;
  String _pickupRef = '';
  String _phase = 'pickup';
  Map<String, dynamic>? _quote;
  String _pay = 'CASH_USD';
  Map<String, dynamic>? _trip;
  Map<String, dynamic>? _driver;
  List<LatLng> _route = [];
  LatLng? _moto;
  io.Socket? _socket;
  var _busy = false;
  String? _error;
  Timer? _poll;

  PassengerApi get _api => PassengerApi(token: widget.token);

  @override
  void initState() {
    super.initState();
    _connect();
  }

  void _connect() {
    final socket = io.io(
      kApiBase,
      io.OptionBuilder().setTransports(['websocket', 'polling']).enableReconnection().disableAutoConnect().build(),
    );
    socket.connect();
    socket.onConnect((_) {
      socket.emit('join_room', {
        'userId': widget.passengerId,
        'role': 'passenger',
        'token': widget.token,
      });
    });
    socket.on('driver_position_changed', (data) {
      if (data is! Map || !mounted) return;
      setState(() => _moto = LatLng((data['latitude'] as num).toDouble(), (data['longitude'] as num).toDouble()));
    });
    socket.on('trip_accepted', (data) async {
      if (!mounted) return;
      setState(() => _phase = 'ride');
      await _reload();
    });
    socket.on('trip_status_changed', (_) => _reload());
    socket.on('driver_nearby', (data) async {
      if (data is! Map) return;
      await alerts.show(
        42,
        data['title']?.toString() ?? 'Tu moto está cerca',
        data['body']?.toString() ?? 'El motorizado está a menos de 100 metros.',
        const NotificationDetails(
          android: AndroidNotificationDetails('rapidez_alerts', 'Avisos Rapidez', importance: Importance.max, priority: Priority.high, playSound: true),
        ),
      );
    });
    _socket = socket;
  }

  Future<void> _reload() async {
    final id = _trip?['id']?.toString();
    if (id == null) return;
    try {
      final data = await _api.trip(id);
      if (!mounted) return;
      setState(() {
        _trip = data['trip'] as Map<String, dynamic>?;
        _driver = data['driver'] as Map<String, dynamic>?;
        final status = _trip?['status'];
        if (status == 'COMPLETED') _phase = 'done';
        if (status == 'CANCELLED') _phase = 'pickup';
      });
    } catch (_) {}
  }

  Future<void> _quoteAndConfirm() async {
    final pickup = _pickup;
    if (pickup == null || _pickupRef.length < 4) {
      setState(() => _error = 'La referencia de Carora es obligatoria.');
      return;
    }
    setState(() => _busy = true);
    try {
      final quote = await _api.quote(
        originLat: pickup.latitude,
        originLng: pickup.longitude,
        destinationLat: _center.latitude,
        destinationLng: _center.longitude,
      );
      final coords = quote['coordinates'];
      setState(() {
        _dropoff = _center;
        _quote = quote;
        _phase = 'confirm';
        _error = null;
        _route = coords is List
            ? coords
                .whereType<Map>()
                .map((p) => LatLng((p['latitude'] as num).toDouble(), (p['longitude'] as num).toDouble()))
                .toList()
            : [];
      });
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _request() async {
    final pickup = _pickup;
    final drop = _dropoff;
    if (pickup == null || drop == null) return;
    setState(() => _busy = true);
    try {
      final result = await _api.createTrip({
        'originLat': pickup.latitude,
        'originLng': pickup.longitude,
        'originAddress': 'Carora',
        'originReference': _pickupRef,
        'destinationLat': drop.latitude,
        'destinationLng': drop.longitude,
        'destinationAddress': 'Carora',
        'destinationReference': _destReference.text.trim(),
        'paymentMethod': _pay,
      });
      setState(() {
        _trip = result['trip'] as Map<String, dynamic>?;
        _phase = 'wait';
        _error = null;
      });
      _poll?.cancel();
      _poll = Timer.periodic(const Duration(seconds: 8), (_) => _reload());
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _payMovil() async {
    final driver = _driver;
    final pago = driver?['pagoMovil'];
    final ref = TextEditingController();
    final code = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Pago Móvil'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Monto: ${_trip?['fareVes']} Bs'),
            _copyRow('Teléfono', pago?['phone']?.toString() ?? ''),
            _copyRow('Cédula', pago?['holderId']?.toString() ?? ''),
            _copyRow('Banco', '${pago?['bankName'] ?? ''} ${pago?['bankCode'] ?? ''}'),
            TextField(
              controller: ref,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(labelText: 'Últimos 6 dígitos'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('CERRAR')),
          FilledButton(
            onPressed: () => Navigator.pop(context, ref.text),
            child: const Text('REPORTAR PAGO'),
          ),
        ],
      ),
    );
    if (code == null || code.length < 4) return;
    try {
      await _api.reportPayment(_trip!['id'].toString(), code);
      if (mounted) setState(() => _error = null);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Referencia enviada al motorizado')));
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    }
  }

  Widget _copyRow(String label, String value) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text('$label: $value'),
      trailing: IconButton(
        icon: const Icon(Icons.copy),
        onPressed: () {
          Clipboard.setData(ClipboardData(text: value));
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$label copiado')));
        },
      ),
    );
  }

  @override
  void dispose() {
    _poll?.cancel();
    _socket?.dispose();
    _reference.dispose();
    _destReference.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final markers = <Marker>[
      if (_pickup != null)
        Marker(point: _pickup!, width: 36, height: 36, child: const Icon(Icons.trip_origin, color: Colors.green)),
      if (_dropoff != null)
        Marker(point: _dropoff!, width: 36, height: 36, child: const Icon(Icons.flag, color: Colors.black)),
      if (_moto != null)
        Marker(point: _moto!, width: 42, height: 42, child: const Icon(Icons.two_wheeler, color: Color(0xFFE6A100), size: 36)),
    ];
    return Scaffold(
      body: Stack(
        children: [
          FlutterMap(
            mapController: _map,
            options: MapOptions(
              initialCenter: _center,
              initialZoom: 16,
              onPositionChanged: (position, _) {
                final c = position.center;
                _center = c;
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 've.rapidez.carora.passenger',
              ),
              if (_route.length > 1) PolylineLayer(polylines: [Polyline(points: _route, strokeWidth: 4, color: Colors.black)]),
              MarkerLayer(markers: markers),
            ],
          ),
          if (_phase == 'pickup' || _phase == 'dest')
            const IgnorePointer(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.only(bottom: 28),
                  child: Icon(Icons.location_on, size: 46, color: Colors.redAccent),
                ),
              ),
            ),
          Positioned(
            top: MediaQuery.paddingOf(context).top + 8,
            left: 8,
            right: 8,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final place in kPlaces)
                    Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ActionChip(
                        label: Text(place.name),
                        onPressed: () {
                          final point = LatLng(place.lat, place.lng);
                          _map.move(point, 16);
                          _center = point;
                          if (_reference.text.isEmpty) _reference.text = place.hint;
                        },
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Material(
        elevation: 12,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_error != null) Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                if (_phase == 'pickup') ...[
                  TextField(
                    controller: _reference,
                    decoration: const InputDecoration(
                      labelText: 'Punto de referencia en Carora',
                      hintText: 'Frente a la bodega, portón blanco…',
                    ),
                  ),
                  const SizedBox(height: 8),
                  FilledButton(
                    onPressed: _busy
                        ? null
                        : () {
                            if (_reference.text.trim().length < 4) {
                              setState(() => _error = 'Escribe la referencia. En Carora la calle sola no basta.');
                              return;
                            }
                            setState(() {
                              _pickup = _center;
                              _pickupRef = _reference.text.trim();
                              _phase = 'dest';
                              _error = null;
                            });
                          },
                    child: const Text('CONFIRMAR RECOGIDA'),
                  ),
                ],
                if (_phase == 'dest') ...[
                  Text('Recogida: $_pickupRef'),
                  TextField(
                    controller: _destReference,
                    decoration: const InputDecoration(labelText: 'Referencia del destino (opcional)'),
                  ),
                  const SizedBox(height: 8),
                  FilledButton(onPressed: _busy ? null : _quoteAndConfirm, child: const Text('VER TARIFA')),
                ],
                if (_phase == 'confirm' && _quote != null) ...[
                  Text('\$${_quote!['usd']} · ${_quote!['ves']} Bs · ${_quote!['source']}'),
                  const SizedBox(height: 6),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'CASH_USD', label: Text('USD')),
                      ButtonSegment(value: 'CASH_VES', label: Text('Bs')),
                      ButtonSegment(value: 'PAGO_MOVIL', label: Text('Pago móvil')),
                    ],
                    selected: {_pay},
                    onSelectionChanged: (value) => setState(() => _pay = value.first),
                  ),
                  const SizedBox(height: 8),
                  FilledButton(onPressed: _busy ? null : _request, child: const Text('PEDIR MOTO')),
                ],
                if (_phase == 'wait') const Text('Buscando motorizado en 3,5 km…'),
                if (_phase == 'ride' || _phase == 'done') ...[
                  Text('${_driver?['fullName'] ?? 'Motorizado'} · ${_driver?['vehiclePlate'] ?? ''} · ${_trip?['status'] ?? ''}'),
                  if (_pay == 'PAGO_MOVIL' && _phase != 'done')
                    FilledButton(onPressed: _payMovil, child: const Text('PAGAR CON PAGO MÓVIL')),
                  if (_phase == 'done') const Text('Carrera terminada.'),
                ],
                TextButton(
                  onPressed: () async {
                    final id = _trip?['id']?.toString();
                    if (id != null && _phase != 'done') {
                      try {
                        await _api.cancel(id);
                      } catch (_) {}
                    }
                    _poll?.cancel();
                    setState(() {
                      _phase = 'pickup';
                      _trip = null;
                      _driver = null;
                      _moto = null;
                      _quote = null;
                      _route = [];
                      _pickup = null;
                      _dropoff = null;
                    });
                  },
                  child: const Text('Nueva carrera'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
