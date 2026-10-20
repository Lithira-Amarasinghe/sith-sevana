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
        Text(_statusLabel(_application?.status ?? "Draft"), style: Theme.of(context).textTheme.titleLarge),
        if (_application?.staffNote != null) ...[
          const SizedBox(height: 12),
          _Note(text: _application!.staffNote!),
        ],
        const _SectionTitle("Your details"),
        TextField(controller: _name, enabled: !_locked, decoration: const InputDecoration(labelText: "Full name")),
        const SizedBox(height: 12),
        TextField(controller: _phone, enabled: !_locked, decoration: const InputDecoration(labelText: "Phone number")),
        const _SectionTitle("Application questions"),
        if (_fields.isEmpty)
          const Text("Staff have not published any questions yet.")
        else
          for (final field in _fields) ...[
            TextField(
              controller: _answers[field.id],
              enabled: !_locked,
              decoration: InputDecoration(
                labelText: field.label,
                suffixText: field.required ? "Required" : "Optional",
              ),
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

String _statusLabel(String status) => switch (status) {
      "NeedsInformation" => "Needs information",
      _ => status,
    };

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 28, bottom: 12),
      child: Text(text, style: Theme.of(context).textTheme.titleMedium),
    );
  }
}

class _Note extends StatelessWidget {
  const _Note({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3CD),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(padding: const EdgeInsets.all(12), child: Text(text)),
    );
  }
}

class SettingsMenu extends StatelessWidget {
  const SettingsMenu({super.key, required this.token, required this.supply});

  final String token;
  final SupplyApi supply;

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        ListTile(
          title: const Text("Application form"),
          subtitle: const Text("Questions counsellors answer"),
          trailing: const Icon(Icons.chevron_right),
          onTap: () {
            Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => ApplicationFormPage(token: token, supply: supply),
            ));
          },
        ),
      ],
    );
  }
}

class ApplicationFormPage extends StatefulWidget {
  const ApplicationFormPage({super.key, required this.token, required this.supply});

  final String token;
  final SupplyApi supply;

  @override
  State<ApplicationFormPage> createState() => _ApplicationFormPageState();
}

class _ApplicationFormPageState extends State<ApplicationFormPage> {
  List<ApplicationField> _fields = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final fields = await widget.supply.fields(widget.token);
    if (mounted) {
      setState(() {
        _fields = fields;
        _loading = false;
      });
    }
  }

  Future<void> _add() async {
    final added = await Navigator.of(context).push<bool>(MaterialPageRoute(
      builder: (_) => AddQuestionPage(token: widget.token, supply: widget.supply),
    ));
    if (added == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Application form")),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _add,
        label: const Text("Add question"),
        icon: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _fields.isEmpty
              ? const Center(child: Text("No questions yet.\nAdd the first question counsellors should answer.", textAlign: TextAlign.center))
              : ListView(
                  children: [
                    for (final field in _fields)
                      ListTile(
                        title: Text(field.label),
                        subtitle: Text(field.required ? "Required" : "Optional"),
                        trailing: IconButton(
                          tooltip: "Remove",
                          onPressed: () async {
                            await widget.supply.removeField(widget.token, field.id);
                            _load();
                          },
                          icon: const Icon(Icons.delete_outline),
                        ),
                      ),
                  ],
                ),
    );
  }
}

class AddQuestionPage extends StatefulWidget {
  const AddQuestionPage({super.key, required this.token, required this.supply});

  final String token;
  final SupplyApi supply;

  @override
  State<AddQuestionPage> createState() => _AddQuestionPageState();
}

class _AddQuestionPageState extends State<AddQuestionPage> {
  final _label = TextEditingController();
  bool _required = true;
  String? _error;

  @override
  void dispose() {
    _label.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_label.text.trim().isEmpty) {
      setState(() => _error = "Write the question.");
      return;
    }
    await widget.supply.addField(widget.token, _label.text.trim(), _required);
    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Add question")),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text("Counsellors will see this question on their application."),
          const SizedBox(height: 16),
          TextField(controller: _label, decoration: const InputDecoration(labelText: "Question")),
          const SizedBox(height: 8),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text("Required"),
            subtitle: Text(_required ? "The counsellor must answer this." : "The counsellor may leave this blank."),
            value: _required,
            onChanged: (value) => setState(() => _required = value),
          ),
          if (_error != null) Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          const SizedBox(height: 16),
          FilledButton(onPressed: _save, child: const Text("Save question")),
        ],
      ),
    );
  }
}

class StaffHome extends StatefulWidget {
  const StaffHome({super.key, required this.token, required this.supply, required this.onOpenApplications});

  final String token;
  final SupplyApi supply;
  final VoidCallback onOpenApplications;

  @override
  State<StaffHome> createState() => _StaffHomeState();
}

class _StaffHomeState extends State<StaffHome> {
  int _waiting = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final items = await widget.supply.queue(widget.token);
    if (mounted) setState(() => _waiting = items.length);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        ListTile(
          title: const Text("Applications to review"),
          trailing: Text("$_waiting"),
          onTap: widget.onOpenApplications,
        ),
        const ListTile(
          title: Text("Payments to confirm"),
          subtitle: Text("Not set up yet"),
        ),
        const ListTile(
          title: Text("Complaints to handle"),
          subtitle: Text("Not set up yet"),
        ),
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
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final items = await widget.supply.queue(widget.token);
    if (mounted) {
      setState(() {
        _items = items;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_items.isEmpty) return const Center(child: Text("No applications waiting."));
    return ListView(
      children: [
        for (final application in _items)
          ListTile(
            title: Text(application.displayName.isEmpty ? application.email : application.displayName),
            subtitle: Text(application.email),
            trailing: const Icon(Icons.chevron_right),
            onTap: () async {
              await Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => ReviewPage(token: widget.token, supply: widget.supply, application: application),
              ));
              _load();
            },
          ),
      ],
    );
  }
}

class ReviewPage extends StatefulWidget {
  const ReviewPage({super.key, required this.token, required this.supply, required this.application});

  final String token;
  final SupplyApi supply;
  final CounsellorApplication application;

  @override
  State<ReviewPage> createState() => _ReviewPageState();
}

class _ReviewPageState extends State<ReviewPage> {
  final _note = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _decide(String decision) async {
    try {
      await widget.supply.decide(widget.token, widget.application.id, decision, _note.text);
      if (mounted) Navigator.of(context).pop();
    } on AuthFailure catch (error) {
      setState(() => _error = error.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final application = widget.application;
    final name = application.displayName.isEmpty ? application.email : application.displayName;
    return Scaffold(
      appBar: AppBar(title: Text(name)),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const _SectionTitle("Identity"),
          Text(name),
          Text(application.email),
          if (application.phoneNumber.isNotEmpty) Text(application.phoneNumber),
          if (application.dateOfBirth.isNotEmpty) Text("Date of birth ${application.dateOfBirth}"),
          const _SectionTitle("Answers"),
          for (final answer in application.answers) ...[
            Text(answer.label, style: const TextStyle(fontWeight: FontWeight.w600)),
            Text(answer.value.isEmpty ? "—" : answer.value),
            const SizedBox(height: 12),
          ],
          const _SectionTitle("Decision"),
          TextField(
            controller: _note,
            decoration: const InputDecoration(labelText: "Note to the counsellor"),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 16),
          FilledButton(onPressed: () => _decide("Approve"), child: const Text("Approve")),
          const SizedBox(height: 8),
          OutlinedButton(onPressed: () => _decide("Reject"), child: const Text("Reject")),
          const SizedBox(height: 8),
          TextButton(onPressed: () => _decide("RequestInformation"), child: const Text("Ask for more")),
        ],
      ),
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
