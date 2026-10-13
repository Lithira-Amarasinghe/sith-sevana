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
  List<ApplicationField> _fields = [];
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final Map<String, TextEditingController> _answers = {};
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
    _name.dispose();
    _phone.dispose();
    for (final controller in _answers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    final fields = await widget.supply.fields(widget.token);
    final application = await widget.supply.mine(widget.token);
    if (!mounted) return;
    for (final field in fields) {
      _answers.putIfAbsent(field.id, TextEditingController.new);
      final saved = application?.answers.where((answer) => answer.fieldId == field.id).firstOrNull;
      if (saved != null) _answers[field.id]!.text = saved.value;
    }
    setState(() {
      _fields = fields;
      _application = application;
      _loading = false;
    });
  }

  bool get _locked => _application != null && _application!.status != "Draft" && _application!.status != "NeedsInformation";

  Future<void> _submit() async {
    setState(() => _error = null);
    try {
      await widget.supply.saveIdentity(widget.token, _name.text, _phone.text);
      final answers = [
        for (final field in _fields)
          ApplicationAnswer(fieldId: field.id, label: field.label, value: _answers[field.id]?.text ?? ""),
      ];
      await widget.supply.saveDraft(widget.token, answers);
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
        TextField(controller: _name, enabled: !_locked, decoration: const InputDecoration(labelText: "Full name (required)")),
        const SizedBox(height: 12),
        TextField(controller: _phone, enabled: !_locked, decoration: const InputDecoration(labelText: "Phone number (required)")),
        const SizedBox(height: 12),
        if (_fields.isEmpty)
          const Text("Staff have not added any application questions yet.")
        else
          for (final field in _fields) ...[
            TextField(
              controller: _answers[field.id],
              enabled: !_locked,
              decoration: InputDecoration(labelText: field.required ? "${field.label} (required)" : field.label),
            ),
            const SizedBox(height: 12),
          ],
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ],
        const SizedBox(height: 16),
        if (!_locked && _fields.isNotEmpty) FilledButton(onPressed: _submit, child: const Text("Submit application")),
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
                  Text(application.displayName.isEmpty ? application.email : application.displayName, style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(application.email),
                  if (application.phoneNumber.isNotEmpty) Text(application.phoneNumber),
                  if (application.dateOfBirth.isNotEmpty) Text("Date of birth: ${application.dateOfBirth}"),
                  const SizedBox(height: 8),
                  for (final answer in application.answers) Text("${answer.label}: ${answer.value}"),
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

class ApplicationFormEditor extends StatefulWidget {
  const ApplicationFormEditor({super.key, required this.token, required this.supply});

  final String token;
  final SupplyApi supply;

  @override
  State<ApplicationFormEditor> createState() => _ApplicationFormEditorState();
}

class _ApplicationFormEditorState extends State<ApplicationFormEditor> {
  final _label = TextEditingController();
  bool _required = true;
  List<ApplicationField> _fields = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _label.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final fields = await widget.supply.fields(widget.token);
    if (mounted) setState(() => _fields = fields);
  }

  Future<void> _add() async {
    if (_label.text.trim().isEmpty) return;
    await widget.supply.addField(widget.token, _label.text.trim(), _required);
    _label.clear();
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text("Application questions", style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        const Text("Counsellors fill in these questions. Mark each one required or optional."),
        const SizedBox(height: 12),
        TextField(controller: _label, decoration: const InputDecoration(labelText: "Question")),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text("Required"),
          value: _required,
          onChanged: (value) => setState(() => _required = value),
        ),
        FilledButton(onPressed: _add, child: const Text("Add question")),
        const SizedBox(height: 16),
        for (final field in _fields)
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(field.label),
            subtitle: Text(field.required ? "Required" : "Optional"),
            trailing: IconButton(
              onPressed: () async {
                await widget.supply.removeField(widget.token, field.id);
                await _load();
              },
              icon: const Icon(Icons.delete_outline),
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
