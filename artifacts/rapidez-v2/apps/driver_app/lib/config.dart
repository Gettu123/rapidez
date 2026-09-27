/// Cambia la URL al desplegar, o compila con:
/// flutter build apk --release --dart-define=API_BASE=https://tu-servicio.onrender.com
const String kApiBase = String.fromEnvironment(
  'API_BASE',
  defaultValue: 'https://rapidez-carora-api.onrender.com',
);

const double kCaroraLat = 10.1804;
const double kCaroraLng = -70.08755;
