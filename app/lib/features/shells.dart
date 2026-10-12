import "package:flutter/material.dart";
import "package:sith_sevana/app/role.dart";
import "package:sith_sevana/core/theme.dart";
import "package:sith_sevana/l10n/strings.dart";

class RoleShell extends StatefulWidget {
  const RoleShell({super.key, required this.role, required this.onSignOut});

  final AppRole role;
  final VoidCallback onSignOut;

  @override
  State<RoleShell> createState() => _RoleShellState();
}

class _RoleShellState extends State<RoleShell> {
  int _index = 0;

  List<_Tab> get _tabs => switch (widget.role) {
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
    final tabs = _tabs;
    final title = tabs[_index].label;
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          TextButton(onPressed: widget.onSignOut, child: const Text("Sign out")),
        ],
      ),
      body: _Body(role: widget.role, title: title),
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
  const _Body({required this.role, required this.title});

  final AppRole role;
  final String title;

  @override
  Widget build(BuildContext context) {
    if (role == AppRole.client && title == Strings.home) {
      return const _ClientHome();
    }
    if (role == AppRole.staff && title == Strings.home) {
      return const _StaffHome();
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
        SizedBox(height: 16),
        _StatusChip(label: Strings.waiting, color: AppColors.waiting),
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

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: DecoratedBox(
        decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }
}
