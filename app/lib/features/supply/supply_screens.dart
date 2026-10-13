import "package:flutter/material.dart";
import "package:sith_sevana/features/auth/auth.dart";
import "package:sith_sevana/features/supply/supply.dart";
import "package:sith_sevana/l10n/strings.dart";

class ApplicationScreen extends StatefulWidget {
  const ApplicationScreen({super.key, required this.token, required this.supply, required this.onChanged});

  final String token;
  final SupplyApi supply;
  final VoidCallback onChanged;

  @override
  State<ApplicationScreen> createState() => _ApplicationScreenState();
}

class _ApplicationScreenState extends State<ApplicationScreen> {
  final _statement = TextEditingController();
  CounsellorApplication? _application;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _statement.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final application = await widget.supply.mine(widget.token);
    if (!mounted) return;
    _statement.text = application?.statement ?? "";
    setState(() {
      _application = application;
      _loading = false;
    });
  }

  bool get _locked => _application != null && _application!.status != "Draft" && _application!.status != "NeedsInformation";

  Future<void> _submit() async {
    setState(() => _error = null);
    try {
      await widget.supply.saveDraft(widget.token, _statement.text);
      final submitted = await widget.supply.submit(widget.token);
      if (!mounted) return;
      setState(() => _application = submitted);
      widget.onChanged();
    } on AuthFailure catch (error) {
      setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(_application?.status ?? "Draft", style: Theme.of(context).textTheme.titleMedium),
        if (_application?.staffNote != null) ...[
          const SizedBox(height: 8),
          Text(_application!.staffNote!),
        ],
        const SizedBox(height: 16),
        TextField(
          controller: _statement,
          enabled: !_locked,
          minLines: 4,
          maxLines: 8,
          decoration: const InputDecoration(labelText: "Your application", alignLabelWithHint: true),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ],
        const SizedBox(height: 16),
        if (!_locked) FilledButton(onPressed: _submit, child: const Text("Submit application")),
      ],
    );
  }
}

class ReviewQueue extends StatefulWidget {
  const ReviewQueue({super.key, required this.token, required this.supply});

  final String token;
  final SupplyApi supply;

  @override
  State<ReviewQueue> createState() => _ReviewQueueState();
}

class _ReviewQueueState extends State<ReviewQueue> {
  List<CounsellorApplication> _items = [];
  final _note = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final items = await widget.supply.queue(widget.token);
    if (mounted) setState(() => _items = items);
  }

  Future<void> _decide(CounsellorApplication application, String decision) async {
    await widget.supply.decide(widget.token, application.id, decision, _note.text);
    _note.clear();
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty) return const Center(child: Text(Strings.empty));
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(controller: _note, decoration: const InputDecoration(labelText: "Note to the counsellor")),
        const SizedBox(height: 12),
        for (final application in _items)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(application.email, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(application.statement),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: [
                      FilledButton(onPressed: () => _decide(application, "Approve"), child: const Text("Approve")),
                      OutlinedButton(onPressed: () => _decide(application, "Reject"), child: const Text("Reject")),
                      TextButton(onPressed: () => _decide(application, "RequestInformation"), child: const Text("Ask for more")),
                    ],
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class ApprovedList extends StatefulWidget {
  const ApprovedList({super.key, required this.token, required this.supply});

  final String token;
  final SupplyApi supply;

  @override
  State<ApprovedList> createState() => _ApprovedListState();
}

class _ApprovedListState extends State<ApprovedList> {
  List<String> _emails = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final emails = await widget.supply.approvedEmails(widget.token);
    if (mounted) {
      setState(() {
        _emails = emails;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_emails.isEmpty) return const Center(child: Text("No approved counsellors yet."));
    return ListView(
      children: [for (final email in _emails) ListTile(title: Text(email))],
    );
  }
}
