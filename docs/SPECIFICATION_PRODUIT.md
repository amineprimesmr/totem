# Totem — Spécification produit
## Outil de gestion alternance • École de commerce Totem

---

## 0. Périmètre : outil 100 % interne

**Totem est un outil de gestion interne uniquement.** Il n'existe **aucune interface ni aucun accès** pour les candidats ou les entreprises.

- **Qui y accède :** uniquement l'équipe de l'école (admin, commerciaux, chargés d'admission), via un back-office protégé (login).
- **Candidats et entreprises :** pas de portail, pas de connexion, pas d'inscription publique. Les comptes et données sont créés et gérés par l'équipe dans le back-office. La seule interaction « externe » est le **lien de réponse au match** (Oui/Non) envoyé par e-mail, qui ne nécessite pas de compte.
- **Objectif :** centraliser le suivi candidats / entreprises / offres / matchs et automatiser une partie de la communication, sans exposer d'interface aux candidats ou aux entreprises.

**Intégration Galia SC Forms :** les candidats (alternants inscrits à l'école) et les entreprises peuvent être synchronisés depuis Galia SC Forms (API ou import CSV). Voir `docs/INTEGRATION_GALIA.md`.

**Qualification candidats :** score de qualification (niveau A/B/C) par candidat pour prioriser les propositions (profil complet, en recherche, CV, critères).

---

## 1. Vision & objectifs

**Totem** est un outil centralisé pour une école de commerce qui :
- **Remplit les classes** en alternance en faisant le lien entre candidats et entreprises.
- **Donne une vision globale** à toute l'équipe (commerciaux + chargés d'admission).
- **Automatise** le suivi, le matching et une partie de la communication (e-mails).

**Objectifs mesurables :**
- Taux de placement en alternance en hausse.
- Temps moyen candidat → entreprise signée réduit.
- Moins de doublons et d'oublis grâce au suivi centralisé.

---

## 2. Personas & points de vue

| Persona | Rôle | Besoin principal |
|--------|------|-------------------|
| **École (Admin)** | Gestion de la plateforme | Tableau de bord global, configuration, ajout de fonctionnalités, reporting |
| **Commercial** | Trouve les entreprises | Suivi entreprises, offres, relances, matching candidats ↔ offres |
| **Chargé(e) d'admission** | Trouve les candidats | Suivi candidats, parcours, matching offres ↔ candidats |
*Les candidats et les entreprises ne sont pas des utilisateurs de l'outil : ce sont des entités gérées dans le back-office (fiches, matchs, e-mails).*

---

## 3. Fonctionnalités par point de vue

### 3.1 Vue ÉCOLE (back-office / admin)

- **Dashboard global**
  - KPIs : candidats en recherche, offres actives, matchs en cours, signés ce mois.
  - Funnel visuel : Candidat inscrit → En recherche → En cours → Signé.
  - Carte des candidats et des entreprises (géolocalisation).
- **Gestion des utilisateurs**
  - Commerciaux, chargés d'admission, rôles et permissions.
  - Attribution candidats/entreprises par commercial ou chargé.
- **Configuration**
  - Formations / parcours (MBA, Master, etc.), types de contrats (apprentissage, pro).
  - Critères de matching (secteurs, métiers, rayon géo, durée).
  - Modèles d'e-mails et triggers (quand envoyer quoi).
- **Suivi centralisé**
  - Fiche candidat : statut, historique, matchs, entretiens, documents.
  - Fiche entreprise : offres, candidats proposés, statuts, historique.
  - Timeline par candidat et par entreprise.
- **Reporting & export**
  - Export Excel/CSV, rapports par formation, par commercial, par période.
- **Audit**
  - Logs des actions importantes (qui a fait quoi, quand).

---

### 3.2 Vue COMMERCIAL (équipe école)

- **Portefeuille entreprises**
  - Liste des entreprises assignées avec statut (prospect, partenaire, inactif).
  - Création / édition offres pour le compte de l'entreprise.
- **Matching candidat → entreprise**
  - Pour une offre : liste de candidats matchés (score, localisation, critères).
  - Actions : "Proposer ce candidat", "Planifier entretien".
- **Relances**
  - Rappels pour entreprises sans réponse, offres expirées.
- **Notifications**
  - Nouveau candidat matché à une de mes entreprises, nouveau document candidat.

---

### 3.3 Vue CHARGÉ(E) D'ADMISSION (équipe école)

- **Portefeuille candidats**
  - Liste des candidats avec statut (inscrit, en recherche, en entretien, signé).
  - Filtres : formation, ville, disponibilité, niveau.
- **Matching entreprise → candidat**
  - Pour un candidat : offres matchées (score, distance, critères).
  - Actions : "Proposer cette offre", "Envoyer au candidat", "Planifier entretien".
- **Parcours candidat**
  - Étapes claires : inscription → CV validé → offres envoyées → entretiens → signature.
- **Relances**
  - Candidats sans réponse, candidats à recontacter.

---

### 3.4 Pas de portail candidat ni entreprise

Il n'y a **pas d'espace candidat ni d'espace entreprise** dans Totem. Les candidats et les entreprises sont gérés uniquement depuis le back-office (fiches, matchs, propositions, e-mails). La seule action « externe » est le **lien de réponse au match** (Oui/Non) dans l'e-mail, sans connexion.

---

## 4. Moteur de matching

### 4.1 Données utilisées

**Candidat :**
- Ville / code postal / coordonnées (si dispo).
- Rayon de recherche (km).
- Formation visée, niveau.
- Secteurs / métiers souhaités.
- Type de contrat (apprentissage / pro).
- Date de disponibilité.
- Critères optionnels : taille d'entreprise, télétravail, etc.

**Entreprise / Offre :**
- Adresse du poste.
- Secteur, métier.
- Formation / niveau requis.
- Type de contrat.
- Date de début.
- Critères optionnels.

### 4.2 Règles de score (exemple)

- **Géo** : distance candidat ↔ lieu du poste (pénalité si > rayon candidat).
- **Formation** : formation visée ↔ formation requise (exacte ou équivalente).
- **Secteur / métier** : correspondance partielle ou totale.
- **Type de contrat** : identique = bonus.
- **Disponibilité** : date début candidat ↔ date début offre.

Score global : **0–100** (affiché comme "% de match").  
Possibilité de pondérer les critères (ex. géo 40 %, formation 30 %, reste 30 %).

### 4.3 Quand le matching est calculé

- À la création / mise à jour d'un **candidat** → recalcul des offres matchées.
- À la création / mise à jour d'une **offre** → recalcul des candidats matchés.
- Option : job nocturne qui recalcule tous les matchs (pour statistiques / rapports).

---

## 5. E-mails automatisés

### 5.1 Principes

- **Templates** modifiables par l'école (texte, variables : `{prenom}`, `{nom_entreprise}`, `{lien_offre}`, etc.).
- **Déclencheurs** configurables (activer/désactiver, délai).
- **Historique** : tous les mails envoyés visibles sur la fiche candidat / entreprise.

### 5.2 Exemples de scénarios

| Déclencheur | Destinataire | Exemple de contenu |
|-------------|--------------|---------------------|
| Nouveau candidat inscrit | Chargé d'admission | "Un nouveau candidat, [Prénom], s'est inscrit pour [Formation]." |
| Offre correspondante disponible | Candidat | "Une offre chez [Entreprise] correspond à votre profil. [Lien]" |
| Candidat proposé à l'entreprise | Entreprise | "[Prénom] [Nom] correspond à votre offre [Titre]. Consulter le profil." |
| Entretien planifié | Candidat + Entreprise | "Entretien confirmé le [Date] à [Heure]." |
| Pas de réponse sous 7 jours | Commercial / Chargé | "Rappel : [Candidat/Entreprise] n'a pas répondu." |
| Signature (contrat signé) | Équipe école | "[Candidat] a signé avec [Entreprise] pour [Formation]." |
| Relance entreprise inactive | Commercial | "3 offres de [Entreprise] expirent bientôt." |

### 5.3 Paramètres utiles

- Fréquence max (ex. pas plus d'1 mail "nouvelle offre" par jour au candidat).
- Préférences candidat / entreprise (opt-in / opt-out par type de mail).
- Envoi en nom de l'école (adresse expéditeur, signature).

---

## 6. UX : fluidité, animations, parcours

### 6.1 Principes généraux

- **Clarté** : une idée par écran, libellés courts, hiérarchie visuelle nette.
- **Feedback immédiat** : chaque action (clic, envoi) donne un retour visuel (toast, état de chargement).
- **Cohérence** : même pattern pour "liste → détail → action" partout (candidats, entreprises, offres).
- **Progressive disclosure** : infos essentielles d'abord, détails en "voir plus" ou onglets.

### 6.2 Animations (léger, utile)

- **Transitions de page** : fade ou slide court (200–300 ms).
- **Listes** : apparition en léger décalage (stagger) pour les cartes / lignes.
- **Modales** : ouverture/fermeture en scale + fade.
- **Boutons** : micro-interaction au hover (léger scale ou changement de couleur).
- **Skeleton loaders** pendant les chargements (pas seulement spinner).
- **Toasts** : slide-in depuis le coin (ex. droite), disparition automatique.
- **Drag & drop** : si réorganisation de priorités (ex. ordre des offres), animation fluide.

Éviter : animations longues ou décoratives qui retardent l'utilisateur.

### 6.3 Parcours "first-time" (équipe école uniquement)

- **École** : court tutoriel ou checklist "Premiers pas" (configurer une formation, un template mail, un premier match). Pas d'onboarding candidat ni entreprise (outil 100 % interne).

### 6.4 Responsive & accessibilité

- Mobile-first pour candidat (et si possible entreprise).
- Back-office utilisable sur tablette (commerciaux / chargés en déplacement).
- Contrastes suffisants, focus clavier, labels pour lecteurs d'écran.

---

## 7. Modèle de données (résumé)

- **Users** : admin, commercial, chargé admission, candidat, entreprise (contact).
- **Candidats** : lié à User, profil, localisation, critères, CV, statut, formation visée.
- **Entreprises** : nom, adresse, secteur, contacts, statut.
- **Offres** : entreprise, titre, description, lieu, type contrat, formation, dates, statut.
- **Matchs** : candidat ↔ offre, score, date, statut (proposé, vu, entretien, refus, accepté).
- **Entretiens** : match, date, heure, lieu/lien, participants, statut.
- **Documents** : liés à candidat ou offre, type (CV, contrat, avenant).
- **Emails** : template, log d'envoi (qui, quand, à qui, déclencheur).
- **Audit** : table de logs (action, user, entity, timestamp).

---

## 8. Stack technique suggérée

- **Front** : React ou Next.js (SSR pour SEO portail candidat), TypeScript, Tailwind CSS, lib d'animations (Framer Motion ou équivalent), state (React Query + Context ou Zustand).
- **Back** : API REST ou GraphQL (Node/Express, NestJS, ou Laravel selon compétences).
- **Base de données** : PostgreSQL (données relationnelles, full-text search pour recherche).
- **Auth** : JWT + refresh tokens, ou solution type Auth0/Keycloak pour rôles (admin, commercial, chargé, candidat, entreprise).
- **Fichiers** : S3 ou équivalent (CV, contrats).
- **E-mails** : SendGrid, Mailgun ou SMTP + file d'attente (Bull/Redis).
- **Géo** : calcul distance en base (formule Haversine) ou API (Google Maps, Mapbox) pour adresses.
- **Hosting** : Vercel (front) + backend et DB sur un VPS ou PaaS (Railway, Render, etc.).

---

## 9. Roadmap (ordre de développement suggéré)

### Phase 1 — Fondations (4–6 semaines)
- Auth et rôles (école, commercial, chargé, candidat, entreprise).
- Modèle de données (candidats, entreprises, offres).
- CRUD candidats / entreprises / offres (back-office).
- Dashboard école minimal (KPIs basiques).

### Phase 2 — Matching & suivi (3–4 semaines)
- Moteur de matching (score géo + formation + critères).
- Vues "matchs" pour commercial et chargé d'admission.
- Fiches détail candidat / entreprise avec timeline.
- Attribution candidats/entreprises aux commerciaux et chargés.

### Phase 3 — Données candidat & entreprise (côté back-office)
- Création et suivi des profils candidats et entreprises depuis le back-office.
- Liste offres matchées, candidatures, statuts (vues équipe uniquement).
- Notifications et préparation e-mails (pas de portail candidat ni entreprise).

### Phase 4 — E-mails & automatisation (2–3 semaines)
- Templates et variables.
- Déclencheurs (nouveau candidat, nouvelle offre, proposition, entretien).
- File d'envoi, logs, préférences.

### Phase 5 — UX & polish (2–3 semaines)
- Animations, skeletons, toasts.
- Onboarding équipe (premiers pas back-office).
- Reporting et exports.
- Optimisation tablette et accessibilité.

---

## 10. Nom du produit

**Totem** peut symboliser :
- Le point central (le "totem" autour duquel tout s'organise).
- La fierté de l'école et des parcours en alternance.

Si tu veux, on peut détailler une phase en user stories, maquettes texte ou structure de dossiers front/back dans un prochain document.
