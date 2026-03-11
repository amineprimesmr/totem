# Runbook production Totem 2.0

## Prérequis
- Node.js 20.x (obligatoire)
- PostgreSQL accessible et variable `DATABASE_URL` configurée
- Variables d'environnement renseignées

## Variables d'environnement minimales
- `API_PORT` (ex: `4000`)
- `API_URL` (ex: `https://api.totem.your-domain.com`)
- `FRONTEND_URL` (ex: `https://totem.your-domain.com`)
- `CORS_ORIGIN` (ex: `https://totem.your-domain.com`)
- `NEXT_PUBLIC_API_URL` (ex: `https://api.totem.your-domain.com/api`)
- `JWT_SECRET`
- `DATABASE_URL` (Neon)
- `NODE_ENV=production`
- `ENABLE_SWAGGER=false` (recommandé)
- `MESSAGING_CAMPAIGNS_ENABLED=true` (si campagnes actives)

### Variables messaging
- SMTP:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- Twilio SMS (live):
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER`
  - `TWILIO_STATUS_CALLBACK_URL=https://api.<domain>/api/messages/webhooks/twilio/status`

## Procédure de déploiement (Vercel + Railway + Neon)
1. Push `main` propre (`npm ci && npm run typecheck && npm run build`).
2. Sur Railway (API):
   - configurer toutes les variables prod,
   - exécuter `npm run db:generate --workspace @totem/database`,
   - exécuter `npm run db:push --workspace @totem/database` (ou `db:deploy` si migrations versionnées),
   - déployer le service API.
3. Sur Vercel (Web):
   - configurer variables `NEXT_PUBLIC_*`,
   - déployer le projet.
4. Configurer webhook Twilio:
   - URL status callback: `https://api.<domain>/api/messages/webhooks/twilio/status`
   - méthode POST.
5. Vérifier:
   - `GET /api/health` (readiness smtp/twilio/mapbox),
   - login staff sur `/login`,
   - map dashboard,
   - preview campagne, send campagne email, send campagne sms,
   - réponse token Oui/Non,
   - retry failed.
6. Optionnel (staging/prod-like): `npm run test:smoke:campaigns` avec
   - `SMOKE_STAFF_EMAIL`
   - `SMOKE_STAFF_PASSWORD`

## Rollback
1. Revenir au commit précédent stable.
2. Rebuild complet (`npm ci && npm run build`).
3. Si migration en erreur:
   - Appliquer migration corrective
   - Restaurer backup DB si nécessaire
4. Vérifier `/api/health` et login staff.

## Supervision minimale
- Monitorer `5xx`, latence API, erreurs auth, saturation DB.
- Conserver les logs JSON avec `requestId`.
- Alerte si `/api/health` != 200 plus de 2 minutes.
- Alerte Twilio: hausse `undelivered/failed`.
- Alerte campagnes: ratio `ERROR` > 10% sur 15 minutes.
