# Checklist Go-Live Totem 2.0

## Sécurité
- [ ] Inscription publique désactivée (`/api/auth/register` retourne 403)
- [ ] Auth limitée aux rôles staff (`ADMIN`, `COMMERCIAL`, `ADMISSION`)
- [ ] `JWT_SECRET` fort et stocké hors repo
- [ ] `CORS_ORIGIN` limité aux domaines autorisés
- [ ] `ENABLE_SWAGGER=false` en production
- [ ] `MESSAGING_CAMPAIGNS_ENABLED` piloté explicitement (`true` uniquement après validation)

## Backend
- [ ] `/api/health` retourne `status=ok`
- [ ] `/api/health.readiness.smtp` = `ready`
- [ ] `/api/health.readiness.twilio` = `ready` (si SMS activé)
- [ ] Pagination active sur listes candidates/companies/offers
- [ ] Logs JSON avec `x-request-id` présents
- [ ] Swagger désactivé en prod (`ENABLE_SWAGGER=false`)

## Frontend
- [ ] UX shell noire + zone de contenu claire validée
- [ ] Login staff-only fonctionnel
- [ ] Plus de CTA "Créer un compte" public sur landing
- [ ] Pages dashboard clés vérifiées (overview, listes, détails)

## Qualité / CI
- [ ] `npm run lint` vert
- [ ] `npm run typecheck` vert
- [ ] `npm run build` vert
- [ ] Workflow CI GitHub actif
- [ ] Smoke test campagnes: preview / send / respond / retry

## Opérations
- [ ] Backup DB validé
- [ ] Runbook relu par l'équipe
- [ ] Procédure rollback testée sur staging
- [ ] Webhook Twilio status callback configuré et testé
- [ ] Monitoring 24h post-go-live (5xx, latence API, taux erreurs email/SMS)
