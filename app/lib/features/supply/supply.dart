import "dart:convert";

import "package:http/http.dart" as http;
import "package:sith_sevana/core/api.dart";
import "package:sith_sevana/features/auth/auth.dart";

class CounsellorApplication {
  const CounsellorApplication({
    required this.id,
    required this.email,
    required this.statement,
    required this.status,
    this.staffNote,
  });

  final String id;
  final String email;
  final String statement;
  final String status;
  final String? staffNote;

  bool get isApproved => status == "Approved";

  factory CounsellorApplication.fromJson(Map<String, dynamic> json) => CounsellorApplication(
        id: json["id"] as String,
        email: json["email"] as String,
        statement: json["statement"] as String? ?? "",
        status: json["status"] as String,
        staffNote: json["staffNote"] as String?,
      );
}

abstract class SupplyApi {
  Future<CounsellorApplication?> mine(String token);
  Future<CounsellorApplication> saveDraft(String token, String statement);
  Future<CounsellorApplication> submit(String token);
  Future<List<CounsellorApplication>> queue(String token);
  Future<CounsellorApplication> decide(String token, String id, String decision, String? note);
  Future<List<String>> approvedEmails(String token);
}

class HttpSupplyApi implements SupplyApi {
  @override
  Future<CounsellorApplication?> mine(String token) async {
    final response = await http.get(_uri("/api/v1/applications/mine"), headers: _headers(token));
    if (response.statusCode == 204) return null;
    _throwIfNeeded(response);
    return CounsellorApplication.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  @override
  Future<CounsellorApplication> saveDraft(String token, String statement) async {
    final response = await http.put(
      _uri("/api/v1/applications/mine"),
      headers: _headers(token),
      body: jsonEncode({"statement": statement}),
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
  final List<CounsellorApplication> items = [];

  @override
  Future<CounsellorApplication?> mine(String token) async =>
      items.where((item) => item.email == token).firstOrNull;

  @override
  Future<CounsellorApplication> saveDraft(String token, String statement) async {
    final current = await mine(token);
    if (current != null && current.status != "Draft" && current.status != "NeedsInformation") {
      throw AuthFailure("This application can no longer be edited.");
    }
    final next = CounsellorApplication(
      id: current?.id ?? "app-$token",
      email: token,
      statement: statement.trim(),
      status: current?.status ?? "Draft",
      staffNote: current?.staffNote,
    );
    items.removeWhere((item) => item.email == token);
    items.add(next);
    return next;
  }

  @override
  Future<CounsellorApplication> submit(String token) async {
    final current = await saveDraft(token, (await mine(token))?.statement ?? "");
    if (current.statement.isEmpty) throw AuthFailure("Write a short application before submitting.");
    final submitted = CounsellorApplication(
      id: current.id,
      email: current.email,
      statement: current.statement,
      status: "Submitted",
      staffNote: current.staffNote,
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
      statement: current.statement,
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
