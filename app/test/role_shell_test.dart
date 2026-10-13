import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:sith_sevana/features/auth/auth.dart";
import "package:sith_sevana/features/supply/supply.dart";
import "package:sith_sevana/main.dart";

void main() {
  testWidgets("sign in as client opens the client tabs", (tester) async {
    await tester.pumpWidget(SithSevanaApp(auth: DevAuthGateway(), supply: MemorySupplyApi()));
    await tester.enterText(find.byType(TextField).at(0), "client@sithsevana.test");
    await tester.enterText(find.byType(TextField).at(1), "Password1");
    await tester.tap(find.text("Sign in"));
    await tester.pumpAndSettle();

    expect(find.text("Find a counsellor"), findsOneWidget);
    await tester.tap(find.text("Counsellors"));
    await tester.pumpAndSettle();
    expect(find.text("No approved counsellors yet."), findsOneWidget);
    expect(find.text("Counsellors"), findsWidgets);
    expect(find.text("Sessions"), findsOneWidget);
    expect(find.text("Messages"), findsOneWidget);
    expect(find.text("Profile"), findsOneWidget);
  });

  testWidgets("sign in as staff opens the staff queues", (tester) async {
    await tester.pumpWidget(SithSevanaApp(auth: DevAuthGateway(), supply: MemorySupplyApi()));
    await tester.enterText(find.byType(TextField).at(0), "staff@sithsevana.test");
    await tester.enterText(find.byType(TextField).at(1), "Password1");
    await tester.tap(find.text("Sign in"));
    await tester.pumpAndSettle();

    expect(find.text("Applications to review"), findsOneWidget);
    expect(find.text("Payments to confirm"), findsOneWidget);
    expect(find.text("Complaints to handle"), findsOneWidget);
  });

  testWidgets("create account requires the terms", (tester) async {
    await tester.pumpWidget(SithSevanaApp(auth: DevAuthGateway(), supply: MemorySupplyApi()));
    await tester.tap(find.text("Create account"));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).at(0), "new@sithsevana.test");
    await tester.enterText(find.byType(TextField).at(1), "Password1");
    await tester.tap(find.widgetWithText(FilledButton, "Create account"));
    await tester.pumpAndSettle();

    expect(find.text("Accept the terms to create an account."), findsOneWidget);
  });

  testWidgets("a counsellor who is not approved sees only the application", (tester) async {
    await tester.pumpWidget(SithSevanaApp(auth: DevAuthGateway(), supply: MemorySupplyApi()));
    await tester.enterText(find.byType(TextField).at(0), "counsellor@sithsevana.test");
    await tester.enterText(find.byType(TextField).at(1), "Password1");
    await tester.tap(find.text("Sign in"));
    await tester.pumpAndSettle();

    expect(find.text("Submit application"), findsOneWidget);
    expect(find.text("Calendar"), findsNothing);
  });

  test("register rejects a minor", () async {
    expect(
      () => DevAuthGateway().register(
        email: "young@sithsevana.test",
        password: "Password1",
        dateOfBirth: DateTime(DateTime.now().year - 10, 1, 1),
        acceptedTerms: true,
      ),
      throwsA(isA<AuthFailure>()),
    );
  });
}
