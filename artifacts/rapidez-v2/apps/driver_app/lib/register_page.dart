import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api.dart';
import 'session.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key, required this.onDone});
  final Future<void> Function() onDone;

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _cedula = TextEditingController();
  final _plate = TextEditingController();
  final _model = TextEditingController(text: 'Bera');
  final _bank = TextEditingController(text: '0102');
  final _pagoPhone = TextEditingController();
  var _busy = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_name, _phone, _cedula, _plate, _model, _bank, _pagoPhone]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final api = DriverApi();
      final result = await api.register({
        'fullName': _name.text.trim(),
        'phoneNumber': _phone.text.trim(),
        'nationalId': _cedula.text.trim(),
        'vehiclePlate': _plate.text.trim(),
        'vehicleModel': _model.text.trim(),
        'pagoMovilBankCode': _bank.text.trim(),
        'pagoMovilPhone': (_pagoPhone.text.trim().isEmpty ? _phone.text : _pagoPhone.text).trim(),
        'pagoMovilHolderId': _cedula.text.trim(),
      });
      await Session.saveLogin(
        id: result['id'].toString(),
        token: result['accessToken'].toString(),
        name: _name.text.trim(),
      );
      final whatsapp = result['whatsapp'];
      if (whatsapp is Map && whatsapp['url'] is String && (whatsapp['url'] as String).isNotEmpty) {
        final uri = Uri.parse(whatsapp['url'] as String);
        final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
        if (!opened && mounted) {
          await _showText(whatsapp['text']?.toString() ?? '');
        }
      } else if (whatsapp is Map && mounted) {
        await _showText(whatsapp['text']?.toString() ?? '');
      }
      await widget.onDone();
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _showText(String text) async {
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('WhatsApp del administrador'),
        content: Text(
          text.isEmpty
              ? 'El servidor no tiene ADMIN_WHATSAPP. Avisa al administrador con tu cédula, carnet y selfie.'
              : 'Copia este texto y envíalo por WhatsApp junto con las fotos de la cédula, el carnet de circulación y una selfie con la moto.\n\n$text',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: text));
              Navigator.pop(context);
            },
            child: const Text('COPIAR'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registro de motorizado')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Después del registro se abre WhatsApp con la plantilla lista. Adjunta cédula, carnet de circulación y selfie. El administrador te activa a mano.',
          ),
          const SizedBox(height: 12),
          TextField(controller: _name, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Nombre y apellido')),
          const SizedBox(height: 8),
          TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Teléfono', hintText: '04141234567')),
          const SizedBox(height: 8),
          TextField(controller: _cedula, decoration: const InputDecoration(labelText: 'Cédula', hintText: 'V12345678')),
          const SizedBox(height: 8),
          TextField(controller: _plate, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Placa')),
          const SizedBox(height: 8),
          TextField(controller: _model, decoration: const InputDecoration(labelText: 'Modelo de la moto')),
          const SizedBox(height: 8),
          TextField(controller: _bank, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Código banco Pago Móvil', hintText: '0102')),
          const SizedBox(height: 8),
          TextField(controller: _pagoPhone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Teléfono Pago Móvil (si es otro)')),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(_busy ? 'ENVIANDO…' : 'REGISTRARME Y ABRIR WHATSAPP'),
          ),
        ],
      ),
    );
  }
}
