import "package:flutter/material.dart";
import "package:sith_sevana/features/auth/auth.dart";
import "package:sith_sevana/l10n/strings.dart";

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key, required this.auth, required this.onSignedIn});

  final AuthGateway auth;
  final ValueChanged<SignedInUser> onSignedIn;

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _error;
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final user = await widget.auth.signIn(_email.text, _password.text);
      widget.onSignedIn(user);
    } on AuthFailure catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 48),
            Text(Strings.appName, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            const Text("A safe, confidential space to heal, cope, and grow."),
            const SizedBox(height: 32),
            TextField(controller: _email, decoration: const InputDecoration(labelText: Strings.email), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 12),
            TextField(controller: _password, decoration: const InputDecoration(labelText: Strings.password), obscureText: true),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 20),
            FilledButton(onPressed: _busy ? null : _submit, child: const Text(Strings.signIn)),
            TextButton(
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => RegisterScreen(auth: widget.auth, onSignedIn: widget.onSignedIn),
                ));
              },
              child: const Text(Strings.createAccount),
            ),
          ],
        ),
      ),
    );
  }
}

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, required this.auth, required this.onSignedIn});

  final AuthGateway auth;
  final ValueChanged<SignedInUser> onSignedIn;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  DateTime _dob = DateTime(1990, 1, 1);
  bool _accepted = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    try {
      final user = await widget.auth.register(
        email: _email.text,
        password: _password.text,
        dateOfBirth: _dob,
        acceptedTerms: _accepted,
      );
      if (!mounted) return;
      widget.onSignedIn(user);
      Navigator.of(context).pop();
    } on AuthFailure catch (error) {
      setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text(Strings.createAccount)),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          TextField(controller: _email, decoration: const InputDecoration(labelText: Strings.email)),
          const SizedBox(height: 12),
          TextField(controller: _password, decoration: const InputDecoration(labelText: Strings.password), obscureText: true),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text(Strings.dateOfBirth),
            subtitle: Text("${_dob.year}-${_dob.month}-${_dob.day}"),
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                firstDate: DateTime(1900),
                lastDate: DateTime.now(),
                initialDate: _dob,
              );
              if (picked != null) setState(() => _dob = picked);
            },
          ),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: _accepted,
            onChanged: (value) => setState(() => _accepted = value ?? false),
            title: const Text(Strings.acceptTerms),
          ),
          if (_error != null) Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          const SizedBox(height: 12),
          FilledButton(onPressed: _submit, child: const Text(Strings.createAccount)),
        ],
      ),
    );
  }
}
