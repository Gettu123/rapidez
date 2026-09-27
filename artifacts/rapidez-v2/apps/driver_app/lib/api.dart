import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.status = 0});
  final String message;
  final int status;
  @override
  String toString() => message;
}

class DriverApi {
  DriverApi({this.token});

  final String? token;
  final String base = kApiBase;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$base$path');
    late http.Response response;
    try {
      switch (method) {
        case 'POST':
          response = await http.post(uri, headers: _headers, body: jsonEncode(body ?? {}));
        case 'PATCH':
          response = await http.patch(uri, headers: _headers, body: jsonEncode(body ?? {}));
        default:
          response = await http.get(uri, headers: _headers);
      }
    } catch (_) {
      throw ApiException('Sin internet o el servidor Render está dormido. Espera 30 segundos y reintenta.');
    }
    final decoded = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw ApiException('Respuesta inválida del servidor', status: response.statusCode);
    }
    if (response.statusCode >= 400) {
      throw ApiException(
        (decoded['error'] ?? 'Error ${response.statusCode}').toString(),
        status: response.statusCode,
      );
    }
    return decoded;
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> body) {
    return _send('POST', '/api/drivers', body: body);
  }

  Future<Map<String, dynamic>> me() => _send('GET', '/api/drivers/me');

  Future<void> setAvailable(bool available) async {
    await _send('POST', '/api/drivers/me/availability', body: {'available': available});
  }

  Future<Map<String, dynamic>> accept(String tripId) {
    return _send('POST', '/api/trips/$tripId/accept');
  }

  Future<Map<String, dynamic>> setStatus(String tripId, String status) {
    return _send('POST', '/api/trips/$tripId/status', body: {'status': status});
  }

  Future<void> confirmPayment(String tripId, {required bool paid}) async {
    await _send('POST', '/api/trips/$tripId/payment/confirm', body: {'paid': paid});
  }
}
