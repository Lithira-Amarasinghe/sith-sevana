import "package:flutter/material.dart";
import "package:sith_sevana/core/theme.dart";
import "package:sith_sevana/features/auth/auth.dart";
import "package:sith_sevana/features/auth/sign_in_screen.dart";
import "package:sith_sevana/features/shells.dart";
import "package:sith_sevana/l10n/strings.dart";

void main() {
  runApp(SithSevanaApp(auth: DevAuthGateway()));
}

class SithSevanaApp extends StatefulWidget {
  const SithSevanaApp({super.key, required this.auth});

  final AuthGateway auth;

  @override
  State<SithSevanaApp> createState() => _SithSevanaAppState();
}

class _SithSevanaAppState extends State<SithSevanaApp> {
  SignedInUser? _user;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: Strings.appName,
      theme: buildTheme(),
      home: _user == null
          ? SignInScreen(auth: widget.auth, onSignedIn: (user) => setState(() => _user = user))
          : RoleShell(role: _user!.role, onSignOut: () => setState(() => _user = null)),
    );
  }
}
