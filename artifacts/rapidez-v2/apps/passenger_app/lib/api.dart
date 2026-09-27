import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';

class ApiException implements Exception {
  ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

class PassengerApi {
  PassengerApi({this.token});
  final String? token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> _send(String method, String path, {Map<String, dynamic>? body}) async {
    final uri = Uri.parse('$kApiBase$path');
    late http.Response response;
    try {
      if (method == 'POST') {
        response = await http.post(uri, headers: _headers, body: jsonEncode(body ?? {}));
      } else if (method == 'PATCH') {
        response = await http.patch(uri, headers: _headers, body: jsonEncode(body ?? {}));
      } else {
        response = await http.get(uri, headers: _headers);
      }
    } catch (_) {
      throw ApiException('Sin conexión. Si Render está dormido, espera medio minuto.');
    }
    final decoded = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) throw ApiException('Respuesta inválida');
    if (response.statusCode >= 400) {
      throw ApiException((decoded['error'] ?? 'Error ${response.statusCode}').toString());
    }
    return decoded;
  }

  Future<Map<String, dynamic>> register(String name, String phone) {
    return _send('POST', '/api/passengers', body: {'fullName': name, 'phoneNumber': phone});
  }

  Future<void> saveFcm(String fcmToken) async {
    await _send('PATCH', '/api/passengers/me', body: {'fcmToken': fcmToken});
  }

  Future<Map<String, dynamic>> quote({
    required double originLat,
    required double originLng,
    required double destinationLat,
    required double destinationLng,
  }) {
    return _send('POST', '/api/fare-quote', body: {
      'originLat': originLat,
      'originLng': originLng,
      'destinationLat': destinationLat,
      'destinationLng': destinationLng,
    });
  }

  Future<Map<String, dynamic>> createTrip(Map<String, dynamic> body) {
    return _send('POST', '/api/trips', body: body);
  }

  Future<Map<String, dynamic>> trip(String id) => _send('GET', '/api/trips/$id');

  Future<void> reportPayment(String id, String reference) async {
    await _send('POST', '/api/trips/$id/payment', body: {'referenceCode': reference});
  }

  Future<void> cancel(String id) async {
    await _send('POST', '/api/trips/$id/cancel');
  }
}
