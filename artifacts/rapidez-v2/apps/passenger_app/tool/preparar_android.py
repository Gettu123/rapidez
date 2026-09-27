"""Después de flutter create, permisos y (si existe) el plugin de Firebase.
Ejecutar desde apps/passenger_app.
"""
from pathlib import Path

manifest_path = Path("android/app/src/main/AndroidManifest.xml")
if not manifest_path.exists():
    raise SystemExit(
        "No está android/. Primero:\n"
        "flutter create . --org ve.rapidez.carora --project-name rapidez_passenger --platforms android"
    )

text = manifest_path.read_text(encoding="utf-8")
perms = [
    "android.permission.INTERNET",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.POST_NOTIFICATIONS",
]
missing = [p for p in perms if p not in text]
if missing:
    block = "\n".join(f'    <uses-permission android:name="{p}"/>' for p in missing)
    text = text.replace("<application", block + "\n    <application", 1)
manifest_path.write_text(text, encoding="utf-8")
print("Permisos del pasajero listos.")

json_path = Path("android/app/google-services.json")
if not json_path.exists():
    print("AVISO: falta android/app/google-services.json.")
    print("El APK igual compila. El push de Firebase se activa cuando pegues ese archivo y vuelvas a correr este script.")
    raise SystemExit(0)

plugin = 'com.google.gms.google-services'
touched = 0
for path in Path("android").rglob("*"):
    if path.name not in {"settings.gradle", "settings.gradle.kts", "build.gradle", "build.gradle.kts"}:
        continue
    src = path.read_text(encoding="utf-8")
    if plugin in src:
        continue
    if path.name.startswith("settings") and "plugins" in src:
        line = (
            '    id("com.google.gms.google-services") version "4.4.2" apply false\n'
            if path.suffix == ".kts"
            else '    id "com.google.gms.google-services" version "4.4.2" apply false\n'
        )
        src = src.replace("plugins {", "plugins {\n" + line, 1)
        path.write_text(src, encoding="utf-8")
        touched += 1
    elif "app" in path.parts and path.name.startswith("build") and "plugins" in src:
        line = (
            '    id("com.google.gms.google-services")\n'
            if path.suffix == ".kts"
            else '    id "com.google.gms.google-services"\n'
        )
        src = src.replace("plugins {", "plugins {\n" + line, 1)
        path.write_text(src, encoding="utf-8")
        touched += 1
print(f"Plugin de Firebase aplicado en {touched} archivo(s).")
