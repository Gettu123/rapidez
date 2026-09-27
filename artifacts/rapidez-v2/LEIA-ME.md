# Rapidez Carora — versão 2 (sem Google Maps)

Resposta direta: a primeira entrega cobria Supabase, Render, referência obrigatória, Pago Móvil e WhatsApp. **Não** cobria Firebase nem os apps Flutter com OpenStreetMap/OSRM. Este pacote fecha isso.

| Pedido | Onde está |
|---|---|
| Supabase + PostGIS, raio 3,5 km | `backend/schema.sql` e `ST_DWithin` em `backend/server.js` |
| Render + Socket.io (HTTPS/WSS) | `backend/` — mesma URL do site serve o socket |
| Firebase, aviso aos 100 m | `FIREBASE_SERVICE_ACCOUNT` no Render. Sem a chave o aviso ainda sai pelo socket |
| OpenStreetMap | `flutter_map` + `tile.openstreetmap.org` nos dois apps. Sem chave |
| OSRM | `GET /api/route` e a tarifa usam `router.project-osrm.org`. Sem cadastro |
| Referência obrigatória | o servidor recusa a corrida se `originReference` vier vazio |
| Dinheiro USD / Bs e Pago Móvil | `CASH_USD`, `CASH_VES`, `PAGO_MOVIL` + últimos dígitos |
| Cadastro por WhatsApp | `POST /api/drivers` devolve o link `wa.me` com cédula, carnet e selfie |
| Ativação manual | a conta nasce `is_active = false` |

Se você já subiu o zip anterior, **substitua** `server.js`, `package.json`, `schema.sql` e o `README` e faça redeploy no Render. Rode de novo o SQL do raio:

```sql
UPDATE app_settings SET value = '3500' WHERE key = 'search_radius_m';
```

A senha do Supabase continua só na variável `DATABASE_URL`. Não cole ela no GitHub. Se ela passou por um chat, troque em Supabase → Database → Reset database password.

## Firebase (grátis)

1. [console.firebase.google.com](https://console.firebase.google.com) → projeto novo.
2. Adicione um app **Android** com o pacote `ve.rapidez.carora.passenger`.
3. Baixe `google-services.json` e coloque em `apps/passenger_app/android/app/` **depois** do `flutter create` (a pasta `android/` ainda não existe).
4. Engrenagem → Contas de serviço → Gerar nova chave privada.
5. No Render, variável `FIREBASE_SERVICE_ACCOUNT` = o JSON inteiro numa linha. Não suba o arquivo no GitHub.

O app do motorizado **não** precisa de Firebase. O som da oferta de 15 segundos é local. O push é do passageiro, quando a moto chega a menos de 100 m.

## Compilar o APK do motorizado (leve)

No computador, com Flutter stable e Android SDK (`flutter doctor` sem erro de Android):

```bash
cd apps/driver_app
flutter create . --org ve.rapidez.carora --project-name rapidez_driver --platforms android
python tool/preparar_android.py
flutter pub get
flutter build apk --release --target-platform android-arm64 --dart-define=API_BASE=https://SEU-SERVICO.onrender.com
```

O arquivo sai em:

```text
build/app/outputs/flutter-apk/app-release.apk
```

Esse é o APK arm64, o que cabe nos telefones atuais e fica bem menor que o pacote gordo com as três arquiteturas. Copie para o telefone e instale. Na primeira vez o Android pede “origens desconhecidas”.

Troque `SEU-SERVICO` pela URL real do Render. Sem isso o app aponta para `https://rapidez-carora-api.onrender.com`.

No telefone: registre, mande as três fotos no WhatsApp que abrir, e no Supabase:

```sql
UPDATE drivers SET is_active = true WHERE phone_number = '0414XXXXXXX';
```

Volte ao app, toque em atualizar e ligue **En línea**. O GPS segue com a tela bloqueada (notificação “Rapidez en línea”).

## APK do passageiro

```bash
cd apps/passenger_app
flutter create . --org ve.rapidez.carora --project-name rapidez_passenger --platforms android
```

Se for usar push, copie `google-services.json` para `android/app/` agora.

```bash
python tool/preparar_android.py
flutter pub get
flutter build apk --release --target-platform android-arm64 --dart-define=API_BASE=https://SEU-SERVICO.onrender.com
```

Sem o JSON do Firebase o APK do passageiro ainda compila: o aviso dos 100 m toca com o app aberto (socket). Com o JSON e a chave no Render, toca também com o app fechado.

## O que cada cadastro grátis faz

- **Supabase** — banco. Use a URI **Session pooler** (`*.pooler.supabase.com`, porta 5432). A URI `db.*.supabase.co` costuma falhar no Render grátis.
- **Render** — API. Health check: `/health`.
- **Firebase** — só o push. Plano Spark, sem cartão.
- **OpenStreetMap e OSRM** — nenhum cadastro. OSRM público é um demonstrativo: se cair, a tarifa usa linha reta e a corrida continua.
