# Totem — Améliorations & benchmark marché

Document de référence : état des lieux, analyse concurrentielle (Hub3E, Pyramide, etc.) et roadmap pour faire de Totem un logiciel de référence.

---

## 1. Ce que Totem fait déjà (état des lieux)

### 1.1 Fonctionnalités actuelles

| Domaine | Fonctionnalité | Statut |
|--------|----------------|--------|
| **Auth** | Login / Register (candidat, entreprise) | ✅ |
| **Auth** | JWT, rôles (Admin, Commercial, Admission, Candidat, Entreprise) | ✅ |
| **Candidats** | CRUD, liste, filtres (statut, formation, assignation) | ✅ |
| **Candidats** | Fiche détail + matchs + offres suggérées | ✅ |
| **Candidats** | Proposition candidat → offre (création match) | ✅ |
| **Entreprises** | CRUD, liste, filtres, fiche détail + offres | ✅ |
| **Offres** | CRUD, liste par entreprise, fiche + candidats matchés | ✅ |
| **Matching** | Score (géolocalisation, formation, secteur, type de contrat) | ✅ |
| **Matching** | Suggestions offres pour candidat / candidats pour offre | ✅ |
| **Entretiens** | Création, liste par match / candidat | ✅ |
| **Dashboard** | KPIs (candidats en recherche, offres actives, matchs, signés) | ✅ |
| **Dashboard** | Funnel (Inscrits → En recherche → En cours → Signés) | ✅ |
| **Utilisateurs** | Liste des utilisateurs école (admin) | ✅ |
| **E-mails** | Service d’envoi (SMTP), templates, logs | ✅ |
| **E-mails** | Templates seed (nouvelle offre, candidat proposé, entretien) | ✅ |
| **Audit** | Log des actions (service prêt) | ✅ |
| **Portail candidat** | Offres suggérées, mes candidatures, mon profil | ✅ |
| **Portail entreprise** | Mes offres, candidats proposés, profil | ✅ |
| **Assignation** | Candidat → chargé d’admission, Entreprise → commercial | ✅ |

### 1.2 Ce qui a été ajouté (Galia + qualification + matching)

- **Intégration Galia SC Forms** : module `integrations/galia` — sync API (si fournie par SC Form) et import CSV candidats/entreprises pour centraliser les données depuis Galia. Voir `docs/INTEGRATION_GALIA.md`.
- **Qualification candidats** : score 0–100 et niveau A/B/C (prêt à proposer / à compléter / incomplet) selon profil, statut, CV, secteurs, géoloc. Exposé dans la liste et la fiche candidat.
- **Matching enrichi** : pondération configurable (env `MATCHING_WEIGHT_*`), détail du score (geo, formation, secteur, contrat) dans les suggestions pour expliquer le score.

### 1.3 Ce qui manque ou est à renforcer

- Relances automatisées (e-mails/SMS) selon statut ou délai
- Notifications in-app (temps réel ou polling)
- Workflows / scénarios automatisés (si X alors Y)
- Intégration calendrier (prise de RDV, sync Google/Outlook)
- Export / reporting avancé (Excel, PDF, graphiques)
- Conformité RGPD (consentements, droit à l’oubli, mentions)
- Géolocalisation avancée (carte, rayon, calcul distance)
- Gestion des promotions / filières / sessions
- Intégration OPCO / Yparéo (si besoin CFA)
- Personnalisation (champs custom, libellés par école)
- SMS en plus de l’e-mail
- Signature électronique (contrats)
- Tableaux de bord par commercial / chargé
- Onboarding guidé (candidat / entreprise)

---

## 2. Benchmark concurrentiel

### 2.1 [Hub3E](https://www.hub3e.com/) (Link Part)

**Position :** « Plateforme n°1 de l’alternance », +200 centres de formation.

**Fonctionnalités clés :**
- Candidatures centralisées (dépôt → placement)
- **Relance groupée** : dossiers incomplets, relance en masse par **mail ou SMS** personnalisé
- **Matching intelligent** (IA) pour associer candidats et offres
- **Conformité RGPD** (données sécurisées)
- **Statistiques en temps réel** (placements, candidatures, taux de succès)
- **Espace personnel** : tableau de bord candidat et entreprise
- **Géolocalisation** pour la mise en relation
- Automatisation inscription et gestion des données
- Mise en relation directe candidat–entreprise, prise d’entretiens de façon autonome

**Points à s’inspirer pour Totem :** relance groupée mail/SMS, stats temps réel, espace candidat/entreprise clair, matching « intelligent » (enrichir notre scoring).

---

### 2.2 [Pyramide](https://pyramideapp.fr/)

**Position :** « Plateforme CFA nouvelle génération », compatible Yparéo.

**Fonctionnalités clés :**
- **Algorithme de matching** : 15+ critères, « 3x plus de matches qualifiés », identification des meilleurs profils en 48h
- **Automation** : scénarios personnalisés par étape (candidat/entreprise)
- **Communication** : historique, analytics, déclencheurs comportementaux, **séquences e-mail/SMS** programmables
- **Sync calendrier** : Google / Outlook / Teams, **booking automatique**
- **Workflows** personnalisables, templates, réduction des tâches répétitives
- **Tableaux de bord métier** : KPIs, reporting automatique
- **3 interfaces** : conseillers CFA, entreprises, candidats sur une seule plateforme

**Points à s’inspirer :** matching multicritères (enrichir nos critères), séquences e-mail/SMS, intégration calendrier et prise de RDV, workflows configurables.

---

### 2.3 Val Software — AMMON CAMPUS

**Position :** Solution SaaS complète pour CFA.

**Fonctionnalités clés :**
- Gestion **administrative et financière**
- **Automatisation des échanges OPCO**
- Dématérialisation des processus
- Suivi complet des apprenants

**Points à s’inspirer :** si Totem vise un public type CFA, prévoir à terme des briques admin/finance et OPCO (ou intégrations).

---

### 2.4 Tendances marché (2024–2025)

- **70 % des CFA** utilisent un logiciel de recrutement ; **87 % des CFA > 50 apprenants** ont un ATS dédié.
- Enjeux : **RGPD, Qualiopi**, pic de candidatures sur 2–3 mois, **multi-partenaires** (OPCO, Régions), volumes 200–500 candidatures par promotion.
- Critères attendus : **promotions/filières**, **intégration OPCO**, **tableaux de bord pédagogiques**, **workflow CFA**, **conformité**.

---

## 3. Roadmap d’amélioration (priorisée)

### Phase A — Quick wins (1–2 semaines)

| # | Feature | Description | Comment faire |
|---|--------|-------------|----------------|
| A1 | **Relance e-mail automatique** | E-mail automatique si candidat sans activité X jours, ou entreprise n’a pas répondu | Utiliser `EmailsService` + job planifié (cron ou Bull) : requêtes « candidats en recherche sans match depuis 7j », « offres avec matchs non vus depuis 5j » → envoi template |
| A2 | **Export CSV** | Export liste candidats / entreprises / offres (filtres actuels) | Endpoint `GET /candidates/export?format=csv&...`, même query que la liste, stream CSV avec `json2csv` ou équivalent |
| A3 | **Notifications toast** | Déjà en place côté front ; s’assurer que chaque action importante (création, proposition, statut) affiche un toast cohérent | Vérifier les appels `toast.success` / `toast.error` après chaque mutation |
| A4 | **Carte géo** | Carte avec points candidats / entreprises (optionnel par formation ou commercial) | Page ou section « Carte » : Leaflet ou Mapbox, afficher `candidate.city` / `company.city` (ou lat/lon si dispo) |

### Phase B — Expérience et automatisation (2–4 semaines)

| # | Feature | Description | Comment faire |
|---|--------|-------------|----------------|
| B1 | **Séquences e-mail** | Scénarios du type : « J+1 après inscription → mail de bienvenue », « J+3 sans offre vue → relance » | Table `EmailSequence` (étapes, délai, template), job quotidien qui évalue les règles et envoie via `EmailsService` |
| B2 | **SMS** | Relances ou rappels par SMS (Twilio, Vonage, etc.) | Service `SmsService`, templates SMS, même logique que les e-mails (trigger par événement ou séquence) |
| B3 | **Tableaux de bord par rôle** | Dashboard commercial (mes entreprises, mes offres, mes matchs) ; dashboard admission (mes candidats, funnel) | Déjà partiellement en place (filtres par `assignedToId`) ; ajouter des KPIs dédiés (ex. `GET /dashboard/commercial`, `GET /dashboard/admission`) et vues dédiées dans le front |
| B4 | **Onboarding guidé** | Pour candidat : étapes « Complète ton profil », « Indique tes critères » ; pour entreprise : « Crée ta première offre » | Wizard multi-étapes (composant commun), stockage de l’étape en base (user ou candidate/company metadata), liens « Reprendre » depuis le dashboard |
| B5 | **Matching enrichi** | Plus de critères (expérience, langue, mobilité, taille d’entreprise) et pondération configurable par l’école | Étendre le schéma (champs optionnels), `MatchingService` : poids par critère (config en table ou .env), score normalisé 0–100 |

### Phase C — Professionnalisation (1–2 mois)

| # | Feature | Description | Comment faire |
|---|--------|-------------|----------------|
| C1 | **RGPD** | Consentement stocké, droit à l’oubli (anonymisation/suppression), mentions légales, politique de confidentialité | Table `Consent` (userId, type, date) ; endpoint « Supprimer mon compte » (anonymise ou supprime user + candidat/company) ; pages légales (mentions, confidentialité) |
| C2 | **Promotions / filières / sessions** | Promo « 2025-2026 », filière « MBA », session « Septembre » | Modèles `Promotion`, `Filiere`, `Session` ; liaison Candidate et Offer à une promo/session ; filtres et reporting par promo |
| C3 | **Calendrier & RDV** | Prise de rendez-vous (entretien) par le candidat ou l’entreprise, sync agenda | Intégration Calendly-like ou Cal.com (embed ou API), ou création de créneaux côté Totem + envoi lien visio (Zoom/Meet) ; option sync Google/Outlook (API) |
| C4 | **Workflows configurables** | Règles du type « Si candidat en recherche depuis 14j → assigner à un chargé et envoyer mail » | Table `WorkflowRule` (condition, action, priorité), moteur qui tourne en cron et exécute les actions (changement statut, envoi mail, assignation) |
| C5 | **Reporting avancé** | Rapports PDF/Excel par période, par formation, par commercial ; graphiques (évolution placements, funnel) | Endpoints d’agrégation (Prisma groupBy, raw SQL si besoin), lib côté front (Chart.js, Recharts), export PDF (puppeteer ou react-pdf) |
| C6 | **Champs personnalisés** | Champs custom par école (ex. « Préférence télétravail », « Langues ») | Table `CustomField` (entityType, name, type), stockage JSON sur Candidate/Company ou table `CustomFieldValue` ; formulaire dynamique côté front |

### Phase D — Scale et écosystème (au besoin)

| # | Feature | Description | Comment faire |
|---|--------|-------------|----------------|
| D1 | **Intégration OPCO / Yparéo** | Envoi ou réception de flux (candidats, conventions) | API ou imports fichiers selon spec OPCO/Yparéo ; jobs + log des échanges |
| D2 | **Signature électronique** | Signature du contrat d’alternance en ligne | Intégration Yousign, DocuSign ou équivalent (embed + webhook statut) |
| D3 | **SSO / annuaire** | Connexion via Google/Microsoft ou annuaire école | Passport.js ou NextAuth avec providers OAuth ; option SAML pour annuaire |
| D4 | **App mobile** | Consultation candidat/entreprise (offres, candidatures, RDV) | PWA déjà possible avec Next ; ou app React Native / Flutter consommant la même API |

---

## 4. Récapitulatif des « features » du logiciel (liste exhaustive)

Pour avoir un logiciel complet type Hub3E/Pyramide, voici la liste cible. **Gras** = déjà en place ou partiellement.

- **Authentification** (login, register, rôles, JWT)
- **Gestion candidats** (CRUD, statuts, assignation, **fiche détail**, **matchs**, **suggestions**)
- **Gestion entreprises** (CRUD, statuts, assignation, **fiche détail**, **offres**)
- **Gestion offres** (CRUD, statuts, **candidats matchés**, **suggestions**)
- **Matching** (score, **géolocalisation**, **formation**, **secteur**, **type de contrat** ; à enrichir : plus de critères, pondération)
- **Entretiens** (création, **liste par match/candidat** ; à ajouter : calendrier, rappels, lien visio)
- **Dashboard école** (**KPIs**, **funnel** ; à ajouter : par commercial/admission, par promo)
- **E-mails** (**templates**, **envoi**, **logs** ; à ajouter : séquences, relances auto)
- **SMS** (relances, rappels) — à faire
- **Notifications in-app** (centre de notifications, préférences) — à faire
- **Export** (CSV/Excel, **rapports** avancés) — partiel
- **Audit** (**logs d’actions** ; à renforcer : export, filtres)
- **Portail candidat** (**offres**, **candidatures**, **profil** ; à ajouter : onboarding, RDV)
- **Portail entreprise** (**offres**, **candidats proposés**, **profil** ; à ajouter : onboarding, RDV)
- **RGPD** (consentement, droit à l’oubli, mentions) — à faire
- **Promotions / filières / sessions** — à faire
- **Workflows / automatisations** (règles métier) — à faire
- **Calendrier & prise de RDV** — à faire
- **Carte géo** — à faire (quick win)
- **Champs personnalisés** — à faire
- **Signature électronique** — optionnel
- **Intégration OPCO / Yparéo** — optionnel (si cible CFA)

---

## 5. Comment s’en servir concrètement

### 5.1 Pour l’école (admin / commercial / admission)

1. **Dashboard** : vue d’ensemble (KPIs, funnel) ; identifier les goulots (trop de candidats en attente, peu d’offres actives).
2. **Candidats** : filtrer par statut/formation/assigné ; ouvrir une fiche → voir matchs et **offres suggérées** → cliquer « Proposer » pour créer un match.
3. **Entreprises** : idem ; **offres** → pour chaque offre, voir **candidats suggérés** → proposer le candidat.
4. **Entretiens** : créer un entretien depuis un match ; à terme, lier à un créneau et envoyer un lien visio.
5. **Utilisateurs** (admin) : voir qui est commercial / admission ; à terme, assigner des candidats/entreprises par drag & drop ou par règle.
6. **E-mails** : consulter les templates (Settings), activer les relances automatiques une fois la Phase A en place.

### 5.2 Pour le candidat

1. S’inscrire, compléter le profil (ville, formation, critères).
2. Passer en « En recherche » pour apparaître dans les suggestions.
3. Consulter **Mes offres** (suggestions) et **Mes candidatures** (statut par offre).
4. Quand un match est créé par l’école, voir le statut et les entretiens à venir.

### 5.3 Pour l’entreprise

1. S’inscrire, compléter le profil.
2. Créer des **offres** (titre, lieu, formation, type de contrat).
3. Consulter les **candidats proposés** par l’école pour chaque offre.
4. Planifier des entretiens (à renforcer avec calendrier + rappels).

---

## 6. Références

- [Hub3E](https://www.hub3e.com/) — Logiciel recrutement et placement alternance
- [Pyramide](https://pyramideapp.fr/) — Plateforme CFA nouvelle génération
- [Val Software – AMMON CAMPUS](https://www.valsoftware.com/fr/cfa/) — Logiciel gestion CFA
- [MyCVthèque – Guide logiciel recrutement CFA 2025](https://www.mycvtheque.com/articles/logiciel-recrutement-cfa-guide-complet.html)

---

Tu peux utiliser ce document comme feuille de route : commencer par la Phase A (relances, export, carte), puis B (séquences, SMS, dashboards par rôle, onboarding, matching enrichi), puis C (RGPD, promotions, calendrier, workflows, reporting, champs custom) en fonction de ta cible (école de commerce vs CFA) et du temps disponible.
