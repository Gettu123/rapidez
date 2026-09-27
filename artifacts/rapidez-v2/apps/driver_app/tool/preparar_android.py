"""Después de `flutter create`, inserta permisos de GPS en segundo plano.
Ejecutar desde apps/driver_app:  python tool/preparar_android.py
"""
from pathlib import Path

manifest = Path("android/app/src/main/AndroidManifest.xml")
if not manifest.exists():
    raise SystemExit("No está android/. Primero: flutter create . --org ve.rapidez.carora --project-name rapidez_driver --platforms android")

text = manifest.read_text(encoding="utf-8")
if "xmlns:tools" not in text:
    text = text.replace(
        "<manifest ",
        '<manifest xmlns:tools="http://schemas.android.com/tools" ',
        1,
    )

perms = [
    "android.permission.INTERNET",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.ACCESS_BACKGROUND_LOCATION",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.FOREGROUND_SERVICE_LOCATION",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.WAKE_LOCK",
    "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
]
missing = [p for p in perms if p not in text]
if missing:
    block = "\n".join(f'    <uses-permission android:name="{p}"/>' for p in missing)
    text = text.replace("<application", block + "\n    <application", 1)

service = """
        <service
            android:name="id.flutter.flutter_background_service.BackgroundService"
            android:foregroundServiceType="location"
            android:exported="false"
            tools:replace="android:exported,android:foregroundServiceType"/>
"""
if "flutter_background_service.BackgroundService" not in text:
    text = text.replace("</application>", service + "    </application>")

manifest.write_text(text, encoding="utf-8")
print("AndroidManifest del motorizado listo.")
