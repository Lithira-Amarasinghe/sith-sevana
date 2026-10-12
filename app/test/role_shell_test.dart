import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:sith_sevana/main.dart";

void main() {
  testWidgets("client shell shows the five agreed tabs", (tester) async {
    await tester.pumpWidget(const SithSevanaApp());
    await tester.tap(find.text("Client"));
    await tester.pumpAndSettle();

    expect(find.text("Home"), findsWidgets);
    expect(find.text("Counsellors"), findsOneWidget);
    expect(find.text("Sessions"), findsOneWidget);
    expect(find.text("Messages"), findsOneWidget);
    expect(find.text("Profile"), findsOneWidget);
    expect(find.text("Find a counsellor"), findsOneWidget);
  });

  testWidgets("staff home shows the three queues", (tester) async {
    await tester.pumpWidget(const SithSevanaApp());
    await tester.tap(find.text("Staff"));
    await tester.pumpAndSettle();

    expect(find.text("Applications to review"), findsOneWidget);
    expect(find.text("Payments to confirm"), findsOneWidget);
    expect(find.text("Complaints to handle"), findsOneWidget);
  });
}
