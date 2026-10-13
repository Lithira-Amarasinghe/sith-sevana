import "package:flutter/material.dart";
import "package:sith_sevana/app/role.dart";
import "package:sith_sevana/core/theme.dart";
import "package:sith_sevana/features/auth/auth.dart";
import "package:sith_sevana/features/supply/supply.dart";
import "package:sith_sevana/features/supply/supply_screens.dart";
import "package:sith_sevana/l10n/strings.dart";

class RoleShell extends StatefulWidget {
  const RoleShell({super.key, required this.user, required this.supply, required this.onSignOut});

  final SignedInUser user;
  final SupplyApi supply;
  final VoidCallback onSignOut;

  @override
  State<RoleShell> createState() => _RoleShellState();
}

class _RoleShellState extends State<RoleShell> {
  int _index = 0;
  CounsellorApplication? _application;
  bool _checked = false;

  @override
  void initState() {
    super.initState();
    _loadApplication();
  }

  Future<void> _loadApplication() async {
    if (widget.user.role != AppRole.counsellor) {
      setState(() => _checked = true);
      return;
    }
    final application = await widget.supply.mine(widget.user.token);
    if (!mounted) return;
    setState(() {
      _application = application;
      _checked = true;
    });
  }

  AppRole get _role => widget.user.role;

  List<_Tab> get _tabs => switch (_role) {
        AppRole.client => const [
            _Tab(Strings.home, Icons.home_outlined),
            _Tab(Strings.counsellors, Icons.people_outline),
            _Tab(Strings.sessions, Icons.event_outlined),
            _Tab(Strings.messages, Icons.chat_bubble_outline),
            _Tab(Strings.profile, Icons.person_outline),
          ],
        AppRole.counsellor => const [
            _Tab(Strings.today, Icons.today_outlined),
            _Tab(Strings.calendar, Icons.calendar_month_outlined),
            _Tab(Strings.messages, Icons.chat_bubble_outline),
            _Tab(Strings.clients, Icons.groups_outlined),
            _Tab(Strings.profile, Icons.person_outline),
          ],
        AppRole.staff => const [
            _Tab(Strings.home, Icons.home_outlined),
            _Tab(Strings.counsellors, Icons.verified_outlined),
            _Tab(Strings.payments, Icons.payments_outlined),
            _Tab(Strings.support, Icons.support_agent_outlined),
            _Tab(Strings.settings, Icons.tune),
          ],
      };

  @override
  Widget build(BuildContext context) {
    if (!_checked) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final waitingForApproval = _role == AppRole.counsellor && (_application == null || !_application!.isApproved);
    if (waitingForApproval) {
      return Scaffold(
        appBar: AppBar(
          title: const Text("Application"),
          actions: [TextButton(onPressed: widget.onSignOut, child: const Text("Sign out"))],
        ),
        body: ApplicationScreen(token: widget.user.token, supply: widget.supply, onChanged: _loadApplication),
      );
    }
    final tabs = _tabs;
    final title = tabs[_index].label;
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          TextButton(onPressed: widget.onSignOut, child: const Text("Sign out")),
        ],
      ),
      body: _Body(role: _role, title: title, user: widget.user, supply: widget.supply),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: [
          for (final tab in tabs) NavigationDestination(icon: Icon(tab.icon), label: tab.label),
        ],
      ),
    );
  }
}

class _Tab {
  const _Tab(this.label, this.icon);
  final String label;
  final IconData icon;
}

class _Body extends StatelessWidget {
  const _Body({required this.role, required this.title, required this.user, required this.supply});

  final AppRole role;
  final String title;
  final SignedInUser user;
  final SupplyApi supply;

  @override
  Widget build(BuildContext context) {
    if (role == AppRole.client && title == Strings.home) return const _ClientHome();
    if (role == AppRole.client && title == Strings.counsellors) {
      return ApprovedList(token: user.token, supply: supply);
    }
    if (role == AppRole.staff && title == Strings.home) return const _StaffHome();
    if (role == AppRole.staff && title == Strings.settings) {
      return ApplicationFormEditor(token: user.token, supply: supply);
    }
    if (role == AppRole.staff && title == Strings.counsellors) {
      return ReviewQueue(token: user.token, supply: supply);
    }
    return Center(child: Text("${Strings.empty}\n$title", textAlign: TextAlign.center));
  }
}

class _ClientHome extends StatelessWidget {
  const _ClientHome();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: const [
        Text("Find a counsellor", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
        SizedBox(height: 8),
        Text("Your next session will show here.", style: TextStyle(color: AppColors.mute)),
      ],
    );
  }
}

class _StaffHome extends StatelessWidget {
  const _StaffHome();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: const [
        _CountCard(label: "Applications to review", count: "0"),
        _CountCard(label: "Payments to confirm", count: "0"),
        _CountCard(label: "Complaints to handle", count: "0"),
      ],
    );
  }
}

class _CountCard extends StatelessWidget {
  const _CountCard({required this.label, required this.count});
  final String label;
  final String count;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(label),
        trailing: Text(count, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
      ),
    );
  }
}

