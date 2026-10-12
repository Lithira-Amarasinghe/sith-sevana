import "package:flutter/material.dart";
import "package:sith_sevana/app/role.dart";
import "package:sith_sevana/core/theme.dart";
import "package:sith_sevana/features/shells.dart";
import "package:sith_sevana/l10n/strings.dart";

void main() {
  runApp(const SithSevanaApp());
}

class SithSevanaApp extends StatefulWidget {
  const SithSevanaApp({super.key});

  @override
  State<SithSevanaApp> createState() => _SithSevanaAppState();
}

class _SithSevanaAppState extends State<SithSevanaApp> {
  AppRole? _role;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: Strings.appName,
      theme: buildTheme(),
      home: _role == null
          ? _RoleGate(onChoose: (role) => setState(() => _role = role))
          : RoleShell(role: _role!, onSignOut: () => setState(() => _role = null)),
    );
  }
}

class _RoleGate extends StatelessWidget {
  const _RoleGate({required this.onChoose});

  final ValueChanged<AppRole> onChoose;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Text(Strings.appName, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              const Text("A safe, confidential space to heal, cope, and grow."),
              const Spacer(),
              Text(Strings.chooseRole, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              FilledButton(onPressed: () => onChoose(AppRole.client), child: const Text(Strings.client)),
              const SizedBox(height: 8),
              FilledButton(onPressed: () => onChoose(AppRole.counsellor), child: const Text(Strings.counsellor)),
              const SizedBox(height: 8),
              FilledButton(onPressed: () => onChoose(AppRole.staff), child: const Text(Strings.staff)),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
