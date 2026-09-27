import 'package:shared_preferences/shared_preferences.dart';

import 'config.dart';

class Session {
  static const _id = 'driverId';
  static const _token = 'accessToken';
  static const _name = 'driverName';
  static const _tracking = 'tracking';
  static const _trip = 'tripId';
  static const _base = 'apiBase';

  static Future<void> saveLogin({
    required String id,
    required String token,
    required String name,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_id, id);
    await prefs.setString(_token, token);
    await prefs.setString(_name, name);
    await prefs.setString(_base, kApiBase);
  }

  static Future<Map<String, String>?> read() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString(_id);
    final token = prefs.getString(_token);
    if (id == null || token == null || id.isEmpty || token.isEmpty) return null;
    return {
      'id': id,
      'token': token,
      'name': prefs.getString(_name) ?? '',
      'base': prefs.getString(_base) ?? kApiBase,
    };
  }

  static Future<void> setTracking(bool on) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_tracking, on);
    await prefs.setString(_base, kApiBase);
  }

  static Future<bool> tracking() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_tracking) ?? false;
  }

  static Future<void> setTrip(String? tripId) async {
    final prefs = await SharedPreferences.getInstance();
    if (tripId == null || tripId.isEmpty) {
      await prefs.remove(_trip);
    } else {
      await prefs.setString(_trip, tripId);
    }
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_id);
    await prefs.remove(_token);
    await prefs.remove(_name);
    await prefs.remove(_trip);
    await prefs.setBool(_tracking, false);
  }
}
