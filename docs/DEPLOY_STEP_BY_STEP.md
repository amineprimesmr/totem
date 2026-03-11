# Deploy Step by Step (Do Everything Possible)

## Ce que l'agent a deja fait
- Initialisation git locale + commit de base.
- Integration Twilio SMS + fallback email.
- Webhook Twilio status callback.
- Durcissement env prod + health/readiness + docs runbook/checklist.
- Compatibilite Railway `PORT` + `railway.json`.

## Ce que je peux faire automatiquement ensuite
- Push vers GitHub.
- Verification build/typecheck.
- Validation technique go/no-go post-deploiement (health/login/map/campaigns).

## Ce que tu dois faire (obligatoire)
1. Creer un repo GitHub vide.
2. Te connecter a GitHub CLI:
   - `brew install gh`
   - `gh auth login`
3. Te connecter a Vercel:
   - `npx -y vercel login`
4. Te connecter a Railway:
   - `npx -y @railway/cli login`

## Commandes exactes a executer (dans le projet)
```bash
cd "/Users/amine/Desktop/Totem2.0"

# 1) Ajouter le remote GitHub
git remote add origin https://github.com/<user>/<repo>.git

# 2) Push du code
git push -u origin main
```

## Variables Railway (API)
- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN=7d`
- `API_URL=https://<api-domain>`
- `FRONTEND_URL=https://<web-domain>`
- `CORS_ORIGIN=https://<web-domain>`
- `ENABLE_SWAGGER=false`
- `MESSAGING_CAMPAIGNS_ENABLED=true`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- `TWILIO_STATUS_CALLBACK_URL=https://<api-domain>/api/messages/webhooks/twilio/status`
- `MAPBOX_TOKEN`

## Variables Vercel (WEB)
- `NEXT_PUBLIC_API_URL=https://<api-domain>/api`
- `NEXT_PUBLIC_APP_URL=https://<web-domain>`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_MAPBOX_STYLE=mapbox/light-v11`

## Migration DB apres deploy API
Sur Railway (service API), executer:
```bash
npm run db:generate --workspace @totem/database
npm run db:push --workspace @totem/database
```

## Verification rapide
1. `GET https://<api-domain>/api/health`
2. Login staff sur le web
3. Dashboard map OK
4. Preview/send email campagne
5. Send SMS + callback Twilio

## Script de diagnostic
Tu peux lancer:
```bash
npx -y node@20 ./scripts/go-live-doctor.mjs
```
Ce script indique les points manquants avant go-live.
