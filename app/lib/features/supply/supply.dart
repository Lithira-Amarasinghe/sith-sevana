import "dart:convert";

import "package:http/http.dart" as http;
import "package:sith_sevana/core/api.dart";
import "package:sith_sevana/features/auth/auth.dart";

class ApplicationField {
  const ApplicationField({required this.id, required this.label, required this.required});

  final String id;
  final String label;
  final bool required;

  factory ApplicationField.fromJson(Map<String, dynamic> json) => ApplicationField(
        id: json["id"] as String,
        label: json["label"] as String,
        required: json["required"] as bool,
      );
}

class ApplicationAnswer {
  const ApplicationAnswer({required this.fieldId, required this.label, required this.value});

  final String fieldId;
  final String label;
  final String value;

  factory ApplicationAnswer.fromJson(Map<String, dynamic> json) => ApplicationAnswer(
        fieldId: json["fieldId"] as String,
        label: json["label"] as String? ?? "",
        value: json["value"] as String? ?? "",
      );

  Map<String, String> toJson() => {"fieldId": fieldId, "label": label, "value": value};
}

class CounsellorApplication {
  const CounsellorApplication({
    required this.id,
    required this.email,
    required this.answers,
    required this.status,
    this.staffNote,
  });

  final String id;
  final String email;
  final List<ApplicationAnswer> answers;
  final String status;
  final String? staffNote;

  bool get isApproved => status == "Approved";

  factory CounsellorApplication.fromJson(Map<String, dynamic> json) => CounsellorApplication(
        id: json["id"] as String,
        email: json["email"] as String,
        answers: ((json["answers"] as List<dynamic>?) ?? [])
            .map((item) => ApplicationAnswer.fromJson(item as Map<String, dynamic>))
            .toList(),
        status: json["status"] as String,
        staffNote: json["staffNote"] as String?,
      );
}

abstract class SupplyApi {
  Future<List<ApplicationField>> fields(String token);
  Future<ApplicationField> addField(String token, String label, bool required);
  Future<void> removeField(String token, String id);
  Future<CounsellorApplication?> mine(String token);
  Future<CounsellorApplication> saveDraft(String token, List<ApplicationAnswer> answers);
  Future<CounsellorApplication> submit(String token);
  Future<List<CounsellorApplication>> queue(String token);
  Future<CounsellorApplication> decide(String token, String id, String decision, String? note);
  Future<List<String>> approvedEmails(String token);
}

class HttpSupplyApi implements SupplyApi {
  @override
  Future<List<ApplicationField>> fields(String token) async {
    final response = await http.get(_uri("/api/v1/application-fields"), headers: _headers(token));
    _throwIfNeeded(response);
    final list = jsonDecode(response.body) as List<dynamic>;
    return list.map((item) => ApplicationField.fromJson(item as Map<String, dynamic>)).toList();
  }

  @override
  Future<ApplicationField> addField(String token, String label, bool required) async {
    final response = await http.post(
      _uri("/api/v1/application-fields"),
      headers: _headers(token),
      body: jsonEncode({"label": label, "required": required}),
    );
    _throwIfNeeded(response);
    return ApplicationField.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  @override
  Future<void> removeField(String token, String id) async {
    final response = await http.delete(_uri("/api/v1/application-fields/$id"), headers: _headers(token));
    _throwIfNeeded(response);
  }

  @override
  Future<CounsellorApplication?> mine(String token) async {
    final response = await http.get(_uri("/api/v1/applications/mine"), headers: _headers(token));
    if (response.statusCode == 204) return null;
    _throwIfNeeded(response);
    return CounsellorApplication.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  @override
  Future<CounsellorApplication> saveDraft(String token, List<ApplicationAnswer> answers) async {
    final response = await http.put(
      _uri("/api/v1/applications/mine"),
      headers: _headers(token),
      body: jsonEncode({"answers": answers.map((answer) => answer.toJson()).toList()}),
    );
    return _application(response);
  }

  @override
  Future<CounsellorApplication> submit(String token) async {
    final response = await http.post(_uri("/api/v1/applications/mine/submit"), headers: _headers(token));
    return _application(response);
  }

  @override
  Future<List<CounsellorApplication>> queue(String token) async {
    final response = await http.get(_uri("/api/v1/applications/queue"), headers: _headers(token));
    _throwIfNeeded(response);
    final list = jsonDecode(response.body) as List<dynamic>;
    return list.map((item) => CounsellorApplication.fromJson(item as Map<String, dynamic>)).toList();
  }

  @override
  Future<CounsellorApplication> decide(String token, String id, String decision, String? note) async {
    final response = await http.post(
      _uri("/api/v1/applications/$id/decide"),
      headers: _headers(token),
      body: jsonEncode({"decision": decision, "note": note}),
    );
    return _application(response);
  }

  @override
  Future<List<String>> approvedEmails(String token) async {
    final response = await http.get(_uri("/api/v1/counsellors"), headers: _headers(token));
    _throwIfNeeded(response);
    final list = jsonDecode(response.body) as List<dynamic>;
    return list.map((item) => (item as Map<String, dynamic>)["email"] as String).toList();
  }

  Uri _uri(String path) => Uri.parse("$apiBase$path");

  Map<String, String> _headers(String token) => {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      };

  CounsellorApplication _application(http.Response response) {
    _throwIfNeeded(response);
    return CounsellorApplication.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  void _throwIfNeeded(http.Response response) {
    if (response.statusCode >= 400) {
      throw AuthFailure(_message(response));
    }
  }

  String _message(http.Response response) {
    try {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return json["error"] as String? ?? "Something went wrong.";
    } catch (_) {
      return "Something went wrong.";
    }
  }
}

class MemorySupplyApi implements SupplyApi {
  final List<ApplicationField> questions = [];
  final List<CounsellorApplication> items = [];

  @override
  Future<List<ApplicationField>> fields(String token) async => questions;

  @override
  Future<ApplicationField> addField(String token, String label, bool required) async {
    final field = ApplicationField(id: "field-${questions.length}", label: label, required: required);
    questions.add(field);
    return field;
  }

  @override
  Future<void> removeField(String token, String id) async => questions.removeWhere((field) => field.id == id);

  @override
  Future<CounsellorApplication?> mine(String token) async =>
      items.where((item) => item.email == token).firstOrNull;

  @override
  Future<CounsellorApplication> saveDraft(String token, List<ApplicationAnswer> answers) async {
    final current = await mine(token);
    final next = CounsellorApplication(
      id: current?.id ?? "app-$token",
      email: token,
      answers: answers,
      status: current?.status ?? "Draft",
      staffNote: current?.staffNote,
    );
    items.removeWhere((item) => item.email == token);
    items.add(next);
    return next;
  }

  @override
  Future<CounsellorApplication> submit(String token) async {
    final current = await mine(token);
    if (questions.isEmpty) throw AuthFailure("Staff have not added any application questions yet.");
    final submitted = CounsellorApplication(
      id: current?.id ?? "app-$token",
      email: token,
      answers: current?.answers ?? [],
      status: "Submitted",
      staffNote: current?.staffNote,
    );
    items.removeWhere((item) => item.email == token);
    items.add(submitted);
    return submitted;
  }

  @override
  Future<List<CounsellorApplication>> queue(String token) async =>
      items.where((item) => item.status == "Submitted").toList();

  @override
  Future<CounsellorApplication> decide(String token, String id, String decision, String? note) async {
    final index = items.indexWhere((item) => item.id == id);
    final current = items[index];
    final status = switch (decision) {
      "Approve" => "Approved",
      "Reject" => "Rejected",
      _ => "NeedsInformation",
    };
    final next = CounsellorApplication(
      id: current.id,
      email: current.email,
      answers: current.answers,
      status: status,
      staffNote: note,
    );
    items[index] = next;
    return next;
  }

  @override
  Future<List<String>> approvedEmails(String token) async =>
      items.where((item) => item.isApproved).map((item) => item.email).toList();
}
