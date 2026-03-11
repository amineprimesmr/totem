# Totem — UX, design & animations

Guide pour une interface ultra fluide, propre et efficace.

---

## 1. Principes de design

### 1.1 Hiérarchie visuelle
- **Une action principale** par écran (bouton primaire bien visible).
- **Titres** : H1 = objectif de la page, H2 = sections, H3 = sous-blocs.
- **Couleurs** : une couleur d’action principale (ex. bleu école), une couleur “succès” (vert), une “attention” (orange), une “danger” (rouge). Le reste en niveaux de gris.

### 1.2 Densité d’information
- **Listes** : cartes ou lignes aérées, pas plus de 5–7 infos par ligne.
- **Tableaux** : colonnes repliables sur mobile, tri et filtres toujours accessibles.
- **Fiches détail** : onglets (Profil / Matchs / Historique / Documents) plutôt qu’une longue page.

### 1.3 Langage & ton
- **Candidat** : bienveillant, rassurant (“Votre profil a été envoyé à 3 entreprises”).
- **Entreprise** : professionnel, efficace (“2 candidats correspondent à votre offre”).
- **Back-office** : neutre, action-oriented (“Proposer ce candidat”, “Planifier entretien”).

---

## 2. Composants clés & comportement

### 2.1 Navigation
- **Back-office** : sidebar fixe avec icônes + libellés, section active bien marquée, sous-menus dépliables avec animation (height + opacity).
- **Candidat / Entreprise** : header fixe avec logo, menu burger sur mobile, compte en haut à droite (avatar + dropdown).
- **Fil d’Ariane** pour les vues profondes (ex. Tableau de bord > Candidats > Jean Dupont).

### 2.2 Listes & cartes
- **Carte candidat/entreprise** : photo ou initiales, nom, statut (badge coloré), score de match si pertinent, 1–2 actions (Voir, Proposer).
- **Hover** : légère élévation (shadow), pas de changement de layout.
- **Chargement** : skeleton de cartes (forme identique aux cartes réelles), pas de spinner plein écran.

### 2.3 Fiches détail (candidat / entreprise)
- **En-tête** : nom, statut, actions principales (Modifier, Envoyer un mail, Proposer une offre).
- **Blocs** : bordure légère ou fond différencié, espacement cohérent.
- **Timeline** : événements en ordre chronologique inverse, icône par type (mail, entretien, statut), date + description.

### 2.4 Formulaires
- **Champs** : label au-dessus, placeholder optionnel, message d’erreur sous le champ (rouge, court).
- **Validation** : si possible en temps réel (ex. email valide), sinon à la soumission.
- **Soumission** : bouton désactivé pendant l’envoi, texte “Envoi…” ou spinner dans le bouton.

### 2.5 Modales
- **Ouverture** : overlay (fond semi-transparent) + contenu centré, scale 0.95 → 1 + fade (200 ms).
- **Fermeture** : même durée, inverse. Fermeture au clic sur overlay ou sur “Annuler”.
- **Taille** : adaptée au contenu (petite pour confirmation, grande pour formulaire).

### 2.6 Toasts / notifications
- **Position** : coin supérieur droit (ou bas droit).
- **Contenu** : icône (succès / erreur / info) + message court.
- **Apparition** : slide-in depuis la droite, disparition après 4–5 s ou au clic.
- **Empilement** : max 3 visibles, les suivants en file.

---

## 3. Animations (détail)

### 3.1 Durées
- **Micro** : 150 ms (hover, focus).
- **Courtes** : 200–300 ms (modales, toasts, ouverture de blocs).
- **Moyennes** : 400 ms (transitions de page, listes en stagger).

### 3.2 Easing
- **Sortie** : ease-out (démarrage rapide, fin douce).
- **Entrée** : ease-in ou ease-out selon le sens.
- **Entrée/sortie** : ease-in-out pour les modales.

### 3.3 Exemples concrets (Framer Motion)

```txt
- Liste de cartes : staggerChildren 0.05, initial opacity 0 y 10 → animate 1, 0.
- Modale : initial opacity 0 scale 0.95 → animate 1, 1 avec transition type "easeOut".
- Bouton : whileHover scale 1.02, whileTap scale 0.98.
- Page : AnimatePresence + variant avec opacity + x léger pour slide entre pages.
```

### 3.4 À éviter
- Animations > 500 ms pour des actions courantes.
- Animations qui se répètent en boucle (sauf loader discret).
- Effets 3D ou rotations inutiles.

---

## 4. États d’interface

### 4.1 Vide (empty state)
- Illustration ou icône + message (“Aucune offre pour le moment”) + CTA si pertinent (“Créer ma première offre”).
- Pas de tableau vide sans explication.

### 4.2 Erreur
- Message clair (“Impossible de charger les candidats”) + bouton “Réessayer”.
- Pour erreur formulaire : message en haut du formulaire + champs concernés marqués.

### 4.3 Chargement
- Skeleton > spinner pour les listes et blocs.
- Spinner réservé aux boutons ou aux chargements courts.

### 4.4 Succès
- Toast + si besoin mise à jour immédiate de la liste (sans recharger toute la page).

---

## 5. Responsive

### 5.1 Breakpoints suggérés
- **Mobile** : < 640 px (candidat prioritaire).
- **Tablette** : 640–1024 px (back-office utilisable).
- **Desktop** : > 1024 px (sidebar toujours visible, tableaux complets).

### 5.2 Adaptations
- **Listes** : sur mobile, une carte par écran ou liste verticale avec “Voir détail”.
- **Tableaux** : cartes empilées ou colonnes masquées avec “Colonnes” pour choisir.
- **Sidebar** : repliée en drawer sur mobile, ouverte au clic sur menu.

---

## 6. Accessibilité (A11y)

- **Contraste** : texte ≥ 4.5:1 sur fond (WCAG AA).
- **Focus** : outline visible au clavier (ne pas supprimer sans remplacement).
- **Labels** : tous les champs associés à un label, boutons avec texte ou aria-label.
- **Rôle sémantique** : boutons, liens, headings corrects pour les lecteurs d’écran.

---

## 7. Récap “ultra propre et fluide”

| Élément | Règle |
|--------|--------|
| Feedback | Toujours un retour visuel (toast, état bouton, skeleton). |
| Animations | Courtes (200–300 ms), utiles (transition, micro-interaction). |
| Densité | Pas plus de 7 infos par carte/ligne, onglets pour le détail. |
| Cohérence | Même pattern liste → détail → action partout. |
| Vide / Erreur | Message + CTA ou “Réessayer”. |
| Mobile | Candidat (et entreprise) mobile-first. |

Tu peux utiliser ce doc comme référence pour les maquettes et l’implémentation (Figma + dev).
