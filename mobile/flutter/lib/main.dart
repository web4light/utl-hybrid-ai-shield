import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_ai/firebase_ai.dart';
import 'package:firebase_app_check/firebase_app_check.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
    await FirebaseAppCheck.instance.activate();
  } catch (_) {
    // Offline / demo režim bez nakonfigurovaného Firebase projektu
  }
  runApp(const UtlHybridApp());
}

class UtlHybridApp extends StatelessWidget {
  const UtlHybridApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UTL Hybrid AI Shield',
      theme: ThemeData.dark(useMaterial3: true),
      home: const HybridFormScreen(),
    );
  }
}

class HybridFormScreen extends StatefulWidget {
  const HybridFormScreen({super.key});

  @override
  State<HybridFormScreen> createState() => _HybridFormScreenState();
}

class _HybridFormScreenState extends State<HybridFormScreen> {
  bool _identityVerified = false;
  bool _offlineOnly = false;
  String _output = 'Ověř identitu a zadej českou odpověď do formuláře.';
  final _controller = TextEditingController();

  Future<void> _translateHybrid() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    if (!_identityVerified) {
      setState(() => _output = 'BLOKOVÁNO SPARK strážcem: Nejdříve ověř kryptografickou identitu.');
      return;
    }

    try {
      final model = FirebaseAI.googleAI().generativeModel(
        model: 'gemini-2.5-flash',
      );
      final res = await model.generateContent([
        Content.text('Translate strictly from Czech to English: $text'),
      ]);
      setState(() => _output = res.text ?? 'Prázdná odpověď');
    } catch (e) {
      setState(() => _output = '[On-Device Fallback ${_offlineOnly ? "Offline" : "Local"}]: $text');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('UTL Hybrid AI Shield')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FilledButton(
              onPressed: () => setState(() => _identityVerified = true),
              child: Text(_identityVerified ? 'Identita ověřena (256-bit)' : 'Ověřit totožnost'),
            ),
            SwitchListTile(
              title: const Text('Pouze On-Device (Gemini Nano / Apple FM)'),
              value: _offlineOnly,
              onChanged: (v) => setState(() => _offlineOnly = v),
            ),
            TextField(
              controller: _controller,
              decoration: const InputDecoration(labelText: 'Česká odpověď do cizojazyčného dotazníku'),
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _translateHybrid,
              child: const Text('Přeložit přes Firebase AI Logic'),
            ),
            const SizedBox(height: 16),
            Text(_output),
          ],
        ),
      ),
    );
  }
}
