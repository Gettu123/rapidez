class Place {
  const Place(this.name, this.hint, this.lat, this.lng);
  final String name;
  final String hint;
  final double lat;
  final double lng;
}

const kPlaces = <Place>[
  Place('Plaza Bolívar', 'lado de la catedral', 10.1804, -70.08755),
  Place('Catedral San Juan Bautista', 'frente a la plaza', 10.18073, -70.08813),
  Place('Hospital de Carora', 'frente a emergencias', 10.1766, -70.0832),
  Place('Terminal de Pasajeros', 'entrada principal', 10.1702, -70.0746),
  Place('Av. Francisco de Miranda', 'sobre la avenida', 10.1736, -70.0796),
  Place('Zona Industrial', 'portón de la zona', 10.1654, -70.0678),
];
