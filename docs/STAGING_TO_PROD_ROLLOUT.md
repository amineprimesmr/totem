# Staging -> Production Rollout

## 1) Validation staging (prod-like)
- Stack identique: Vercel (web), Railway (api), Neon (db), Twilio test/live numbers.
- Variables `FRONTEND_URL`, `API_URL`, `CORS_ORIGIN` alignées avec domaines staging.
- `MESSAGING_CAMPAIGNS_ENABLED=true` uniquement pendant la phase de test.

## 2) Scénarios de validation obligatoires
- Login staff (`ADMIN`/`COMMERCIAL`/`ADMISSION`) et refus des rôles non staff.
- Dashboard map (Mapbox) + matching visual.
- Campagne email: preview -> send -> clic Oui/Non -> status/counters.
- Campagne sms: preview(channel=SMS) -> send -> callback Twilio -> status/counters.
- Retry failed: relance des items en `ERROR`.

## 3) Gate go-live
- `npm run typecheck` et `npm run build` verts.
- `/api/health` à `status=ok` et readiness conforme.
- Taux erreur campagnes < 5% en staging.

## 4) Mise en production progressive
- Déployer API Railway puis Web Vercel.
- Démarrer avec campagne pilote (petit batch: 5-10 items).
- Vérifier livrabilité SMS/email pendant 30 min.
- Étendre à batch standard seulement si erreur stable.

## 5) Monitoring 24h
- 5xx API, latence p95, erreurs DB.
- Erreurs Twilio `failed/undelivered`.
- Ratio `MessageCampaignItem.ERROR` par campagne.

## 6) Rollback
- Désactiver immédiatement campagnes: `MESSAGING_CAMPAIGNS_ENABLED=false`.
- Revenir au dernier déploiement stable Railway/Vercel.
- Si incident DB: restaurer depuis snapshot Neon.
