# Guide Mapbox (mode gratuit)

## Objectif
Utiliser Mapbox avec un rendu premium, en restant sous le quota gratuit.

## Ce qu'il faut savoir (officiel Mapbox)
- Un **map load** est compte a chaque initialisation d'un objet carte.
- Interactions (zoom/pan/layers) ne comptent pas en plus dans la meme session.
- La session max est 12h.
- Quota gratuit web: **50 000 map loads / mois**.

## Configuration Totem
1. Creer un token public Mapbox.
2. Restreindre le token par domaine:
   - `localhost:3003/*` en dev
   - votre domaine de prod
3. Mettre dans `.env`:
   - `NEXT_PUBLIC_MAPBOX_TOKEN=...`
   - `NEXT_PUBLIC_MAPBOX_STYLE=mapbox/light-v11`

## Protections cout deja implementees
- La carte est chargee **au clic utilisateur** (pas de preload).
- La carte n'est **pas re-initialisee** a chaque refresh de donnees.
- Un fallback gratuit (ESRI) est utilise si le token est absent.

## Bonnes pratiques pour rester gratuit
- Ne pas afficher la carte automatiquement sur chaque page.
- Eviter les remounts inutiles du composant carte.
- Surveiller l'usage dans le dashboard Mapbox.
- Activer une alerte budget cote Mapbox.
