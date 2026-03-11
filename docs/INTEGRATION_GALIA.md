# Intégration Galia SC Forms → Totem

Totem centralise les **candidats en alternance** (inscrits à l’école) et les **entreprises** qui cherchent des alternants. Aujourd’hui ces données sont gérées dans **Galia SC Forms**. Ce document décrit comment connecter Galia à Totem pour centraliser les données et utiliser Totem comme outil de matching et de qualification.

---

## 1. Objectif

- **Source de vérité candidats / entreprises :** Galia reste le logiciel de gestion de l’école ; Totem doit recevoir (sync ou import) les stagiaires/alternants et les entreprises concernés par l’alternance.
- **Totem :** outil de **matching**, **qualification** et **suivi** (propositions, entretiens, relances) sans dupliquer la saisie administrative complète.

---

## 2. Ce dont on a besoin côté Galia

Pour alimenter Totem, il faut pouvoir récupérer au minimum :

### 2.1 Candidats / stagiaires (alternants)

- Identité : nom, prénom, email, téléphone
- Formation / parcours (ex. MBA, Master, année)
- Ville / code postal (pour le matching géo)
- Statut par rapport à l’alternance (inscrit, en recherche, en poste, etc.) si disponible
- Id externe (ex. numéro stagiaire Galia) pour éviter les doublons à la sync

### 2.2 Entreprises (et éventuellement offres)

- Raison sociale, secteur, adresse, ville, code postal
- Contact (email, téléphone) si disponible
- Id externe entreprise Galia
- Optionnel : offres ou postes alternance (sinon les offres restent saisies dans Totem)

---

## 3. Options d’intégration avec Galia SC Forms

### 3.1 API Galia (recommandé si disponible)

SC Form / Galia ouvre des **APIs** pour l’interconnexion (voir [Campus Skills – SC Form/Galia](https://docs.campus-skills.com/synchronisations-avec-logiciels-tiers/scform)).

- **À faire côté école :**
  1. Contacter **SC Form** (commercial ou support) pour demander les **accès API** et l’**URL de l’application** Galia.
  2. Demander explicitement quels **endpoints** exposent :
     - la liste des **stagiaires / alternants** (avec champs formation, ville, statut),
     - la liste des **entreprises** (et éventuellement offres/stages).
  3. Une fois la doc reçue, configurer dans Totem :
     - `GALIA_API_URL=https://...`
     - `GALIA_API_TOKEN=...` (ou mécanisme fourni par SC Form)

Totem fournit un **module d’intégration Galia** qui :
- appelle l’API Galia (endpoints à configurer selon la doc SC Form),
- mappe les données vers le modèle Totem (Candidate, Company),
- crée ou met à jour les enregistrements (via `externalId` pour éviter les doublons).

### 3.2 Export fichier (CSV / Excel) – solution de secours

Si l’API ne propose pas d’export stagiaires/entreprises, ou en attendant :

- Depuis **Galia**, exporter régulièrement (manuel ou planifié) des fichiers :
  - **Candidats :** CSV/Excel avec colonnes (nom, prénom, email, formation, ville, code postal, statut, etc.)
  - **Entreprises :** idem (raison sociale, secteur, ville, contact)
- Totem propose des endpoints **d’import** :
  - `POST /integrations/galia/import-candidates` (fichier CSV + mapping des colonnes)
  - `POST /integrations/galia/import-companies` (idem)

Cela permet de **centraliser dans Totem** sans attendre une API complète.

### 3.3 Synchronisation automatique (cron)

Une fois l’API ou l’import fichier en place :

- **Sync automatique** (ex. chaque nuit) : job qui appelle l’API Galia ou lit un fichier déposé (SFTP, partage) et met à jour Totem.
- Les **nouveaux** candidats/entreprises sont créés, les **existants** mis à jour via `externalId` (ID Galia).

---

## 4. Côté Totem – Modèle de données

Pour lier les enregistrements Totem à Galia sans doublon :

- **Candidate** : champ optionnel `externalId` (string, ex. ID stagiaire Galia) + optionnel `externalSource: 'GALIA'`.
- **Company** : idem `externalId` + `externalSource`.

Lors d’une sync ou import :
- Si `externalId` + `externalSource` correspondent à un enregistrement existant → **mise à jour**.
- Sinon → **création** (et remplissage de `externalId` / `externalSource`).

Les **utilisateurs** (User) pour les candidats et entreprises peuvent être créés automatiquement avec un email généré si besoin (ex. `galia-{externalId}@totem-sync.local`) ou matcher sur email si Galia fournit l’email.

---

## 5. Prochaines étapes opérationnelles

1. **École :** contacter SC Form (03 87 35 57 57 / commercial@sc-form.com) pour obtenir :
   - URL API et accès (token / clientId),
   - Documentation des endpoints « stagiaires / alternants » et « entreprises » (ou procédure d’export fichier).
2. **Développement Totem :** une fois le format connu (API ou CSV), finaliser le module `integrations/galia` (mapping des champs, gestion des conflits, logs de sync).
3. **Pilotage :** lancer une première sync ou import de test, vérifier les données dans Totem, puis mettre en place une fréquence (quotidienne / hebdo) selon le besoin.

---

## 6. Côté Totem – Mise en place technique

- **Schéma BDD :** les modèles `Candidate` et `Company` ont des champs optionnels `externalId` et `externalSource`. Après mise à jour du code, exécuter une migration : `npm run db:migrate` (ou `db:push` en dev).
- **Variables d’environnement (API) :**
  - `GALIA_API_URL` : URL de base de l’API Galia (ex. `https://galia.sc-form.net`)
  - `GALIA_API_TOKEN` : token d’authentification (fourni par SC Form)
  - `GALIA_DEFAULT_PASSWORD` (optionnel) : mot de passe des comptes candidats créés à l’import (défaut : `ChangeMe123!`)
- **Endpoints Totem (admin uniquement) :**
  - `GET` ou `POST` `/integrations/galia/sync` : lance une sync avec l’API Galia (si configurée)
  - `POST` `/integrations/galia/import-candidates` : import CSV candidats (body multipart, champ `file`)
  - `POST` `/integrations/galia/import-companies` : import CSV entreprises (body multipart, champ `file`)

## 7. Références

- [Campus Skills – Synchronisation SC Form / Galia](https://docs.campus-skills.com/synchronisations-avec-logiciels-tiers/scform)
- SC Form : 03 87 35 57 57, commercial@sc-form.com
