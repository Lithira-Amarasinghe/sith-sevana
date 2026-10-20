import "dart:convert";

import "package:http/http.dart" as http;
import "package:sith_sevana/app/role.dart";
import "package:sith_sevana/core/api.dart";

class SignedInUser {
  const SignedInUser({required this.email, required this.role, required this.token});

  final String email;
  final AppRole role;
  final String token;
}

abstract class AuthGateway {
  Future<SignedInUser> signIn(String email, String password);
  Future<SignedInUser> register({
    required String email,
    required String password,
    required DateTime dateOfBirth,
    required bool acceptedTerms,
  });
}

class DevAuthGateway implements AuthGateway {
  static const password = "Password1";

  @override
  Future<SignedInUser> signIn(String email, String password) async {
    if (password != DevAuthGateway.password) {
      throw AuthFailure("Email or password is incorrect.");
    }
    final role = switch (email.trim().toLowerCase()) {
      "staff@sithsevana.test" => AppRole.staff,
      "counsellor@sithsevana.test" => AppRole.counsellor,
      "client@sithsevana.test" => AppRole.client,
      _ => throw AuthFailure("Email or password is incorrect."),
    };
    return SignedInUser(email: email.trim(), role: role, token: "dev");
  }

  @override
  Future<SignedInUser> register({
    required String email,
    required String password,
    required DateTime dateOfBirth,
    required bool acceptedTerms,
  }) async {
    if (!acceptedTerms) {
      throw AuthFailure("Accept the terms to create an account.");
    }
    final today = DateTime.now();
    var age = today.year - dateOfBirth.year;
    final birthday = DateTime(today.year, dateOfBirth.month, dateOfBirth.day);
    if (birthday.isAfter(today)) age--;
    if (age < 18) {
      throw AuthFailure("You must be 18 or older.");
    }
    if (password.length < 8) {
      throw AuthFailure("Password must be at least 8 characters.");
    }
    return SignedInUser(email: email.trim(), role: AppRole.client, token: "dev");
  }
}

class HttpAuthGateway implements AuthGateway {
  @override
  Future<SignedInUser> signIn(String email, String password) => _post("/api/v1/auth/login", {
        "email": email,
        "password": password,
      });

  @override
  Future<SignedInUser> register({
    required String email,
    required String password,
    required DateTime dateOfBirth,
    required bool acceptedTerms,
  }) {
    final month = dateOfBirth.month.toString().padLeft(2, "0");
    final day = dateOfBirth.day.toString().padLeft(2, "0");
    return _post("/api/v1/auth/register", {
      "email": email,
      "password": password,
      "dateOfBirth": "${dateOfBirth.year}-$month-$day",
      "acceptedTerms": acceptedTerms,
    });
  }

  Future<SignedInUser> _post(String path, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse("$apiBase$path"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode(body),
    );
    if (response.statusCode >= 400) {
      throw AuthFailure(_error(response.body));
    }
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return SignedInUser(
      email: json["email"] as String,
      role: _role(json["role"] as String),
      token: json["token"] as String,
    );
  }

  AppRole _role(String role) => switch (role) {
        "Staff" => AppRole.staff,
        "Counsellor" => AppRole.counsellor,
        _ => AppRole.client,
      };

  String _error(String body) {
    try {
      return (jsonDecode(body) as Map<String, dynamic>)["error"] as String? ?? "Something went wrong.";
    } catch (_) {
      return "Something went wrong.";
    }
  }
}

class AuthFailure implements Exception {
  AuthFailure(this.message);
  final String message;
}
