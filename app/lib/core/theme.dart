import "package:flutter/material.dart";

class AppColors {
  static const primary = Color(0xFF3498DB);
  static const primaryPressed = Color(0xFF2980B9);
  static const ink = Color(0xFF2C3E50);
  static const mute = Color(0xFF7F8C8D);
  static const canvas = Color(0xFFFFFCFC);
  static const confirmed = Color(0xFF43A047);
  static const waiting = Color(0xFFF39C12);
}

ThemeData buildTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
    scaffoldBackgroundColor: AppColors.canvas,
    fontFamily: "sans-serif",
  );
  return base.copyWith(
    textTheme: base.textTheme.apply(bodyColor: AppColors.ink, displayColor: AppColors.ink),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(48),
        shape: const StadiumBorder(),
      ),
    ),
  );
}
