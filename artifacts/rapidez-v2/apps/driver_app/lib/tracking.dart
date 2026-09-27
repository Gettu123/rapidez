import 'dart:async';
import 'dart:ui';

import 'package:flutter/widgets.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import 'config.dart';

const String kChannelId = 'rapidez_tracking';
const int kNotificationId = 888;

Future<void> initializeTrackingService() async {
  final notifications = FlutterLocalNotificationsPlugin();
  const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
  await notifications.initialize(const InitializationSettings(android: androidInit));
  const channel = AndroidNotificationChannel(
    kChannelId,
    'Rapidez en línea',
    description: 'GPS del motorizado mientras está disponible',
    importance: Importance.low,
  );
  await notifications
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);

  final service = FlutterBackgroundService();
  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onStartTracking,
      autoStart: false,
      isForegroundMode: true,
      notificationChannelId: kChannelId,
      initialNotificationTitle: 'Rapidez',
      initialNotificationContent: 'Iniciando rastreo…',
      foregroundServiceNotificationId: kNotificationId,
      foregroundServiceTypes: [AndroidForegroundType.location],
    ),
    iosConfiguration: IosConfiguration(
      autoStart: false,
      onForeground: onStartTracking,
    ),
  );
}

@pragma('vm:entry-point')
void onStartTracking(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();
  WidgetsFlutterBinding.ensureInitialized();

  if (service is AndroidServiceInstance) {
    service.setAsForegroundService();
  }

  final prefs = await SharedPreferences.getInstance();
  final base = prefs.getString('apiBase') ?? kApiBase;
  final driverId = prefs.getString('driverId');
  final token = prefs.getString('accessToken');
  if (driverId == null || token == null) {
    await service.stopSelf();
    return;
  }

  final socket = io.io(
    base,
    io.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .enableReconnection()
        .setReconnectionDelay(2000)
        .disableAutoConnect()
        .build(),
  );
  socket.connect();
  socket.onConnect((_) {
    socket.emit('join_room', {
      'userId': driverId,
      'role': 'driver',
      'token': token,
    });
  });

  Future<void> sendFix() async {
    final live = await SharedPreferences.getInstance();
    if (!(live.getBool('tracking') ?? false)) return;
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      socket.emit('driver_location_update', {
        'latitude': position.latitude,
        'longitude': position.longitude,
        'tripId': live.getString('tripId'),
      });
      if (service is AndroidServiceInstance) {
        service.setForegroundNotificationInfo(
          title: 'Rapidez en línea',
          content:
              '${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}',
        );
      }
    } catch (_) {}
  }

  await sendFix();
  final timer = Timer.periodic(const Duration(seconds: 12), (_) => sendFix());

  service.on('stopService').listen((_) async {
    timer.cancel();
    socket.dispose();
    await service.stopSelf();
  });
}

Future<void> startTracking() async {
  final service = FlutterBackgroundService();
  final running = await service.isRunning();
  if (!running) {
    await service.startService();
  }
}

Future<void> stopTracking() async {
  final service = FlutterBackgroundService();
  if (await service.isRunning()) {
    service.invoke('stopService');
  }
}
