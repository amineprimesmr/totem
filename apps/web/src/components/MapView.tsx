'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl, { LngLatBounds } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapView.css';

interface MapCandidate {
  id: string;
  firstName: string;
  lastName: string;
  city: string | null;
  formation: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
}

interface MapCompany {
  id: string;
  name: string;
  city: string | null;
  sector: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
}

interface MapViewProps {
  candidates: MapCandidate[];
  companies: MapCompany[];
  highlightCandidateScores?: Record<string, number>;
  highlightCompanyScores?: Record<string, number>;
  lineLinks?: Array<{ from: [number, number]; to: [number, number]; score: number }>;
}

type SearchType = 'all' | 'candidate' | 'company';
type PointKind = 'candidate' | 'company';
type MapPoint = {
  id: string;
  kind: PointKind;
  title: string;
  subtitle: string;
  city: string;
  lat: number;
  lng: number;
  href: string;
  score: number | null;
};

const RENNES_CENTER: [number, number] = [-1.6778, 48.1173];
const TOTEM_CAMPUS: [number, number] = [-1.6075, 48.1184]; // Cesson-Sevigne (Totem)

export default function MapView({
  candidates,
  companies,
  highlightCandidateScores = {},
  highlightCompanyScores = {},
  lineLinks = [],
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const schoolMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [mapError, setMapError] = useState<string | null>(null);
  const [useLeafletFallback, setUseLeafletFallback] = useState(false);

  const points = useMemo<MapPoint[]>(() => {
    const c: MapPoint[] = candidates
      .filter((x) => x.latitude != null && x.longitude != null)
      .map((x) => ({
        id: x.id,
        kind: 'candidate',
        title: `${x.firstName} ${x.lastName}`,
        subtitle: x.formation,
        city: x.city ?? 'Ville inconnue',
        lat: x.latitude!,
        lng: x.longitude!,
        href: `/dashboard/candidates/${x.id}`,
        score: highlightCandidateScores[x.id] ?? null,
      }));
    const co: MapPoint[] = companies
      .filter((x) => x.latitude != null && x.longitude != null)
      .map((x) => ({
        id: x.id,
        kind: 'company',
        title: x.name,
        subtitle: x.sector,
        city: x.city ?? 'Ville inconnue',
        lat: x.latitude!,
        lng: x.longitude!,
        href: `/dashboard/companies/${x.id}`,
        score: highlightCompanyScores[x.id] ?? null,
      }));
    return [...c, ...co];
  }, [candidates, companies, highlightCandidateScores, highlightCompanyScores]);

  const filteredPoints = useMemo(() => {
    const q = query.trim().toLowerCase();
    return points.filter((p) => {
      const typeOk = searchType === 'all' ? true : p.kind === searchType;
      if (!typeOk) return false;
      if (!q) return true;
      return `${p.title} ${p.subtitle} ${p.city}`.toLowerCase().includes(q);
    });
  }, [points, query, searchType]);

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;
    const fetchSignature = String(window.fetch);
    if (fetchSignature.includes('chrome-extension://')) {
      setUseLeafletFallback(true);
      setMapError(
        'Un module navigateur intercepte les requêtes Mapbox. Passage automatique en carte fallback stable.',
      );
      return;
    }
    mapboxgl.accessToken = token;

    const rawStyle = process.env.NEXT_PUBLIC_MAPBOX_STYLE || 'mapbox/streets-v12';
    const style = normalizeMapboxStyle(rawStyle);
    const styleProbeUrl = buildMapboxStyleProbeUrl(rawStyle, token);
    let cancelled = false;

    const onBrowserError = (event: ErrorEvent) => {
      const message = String(event?.error?.message ?? event.message ?? '');
      const isFetchFailure = message.includes('Failed to fetch');
      const isAbortError = message.includes('AbortError') || message.includes('signal is aborted');
      const fromMapbox = String(event.filename ?? '').includes('mapbox-gl');
      const fromExtension = String(event.filename ?? '').startsWith('chrome-extension://');
      if ((isFetchFailure || isAbortError) && (fromMapbox || fromExtension)) {
        event.preventDefault();
        setUseLeafletFallback(true);
        setMapError(
          'Impossible de charger la carte Mapbox (échec réseau). Vérifiez la clé Mapbox, la connexion ou un bloqueur navigateur.',
        );
      }
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonText =
        typeof event.reason === 'string'
          ? event.reason
          : String(event.reason?.message ?? event.reason ?? '');
      const isFetchFailure = reasonText.includes('Failed to fetch');
      const isAbortError = reasonText.includes('AbortError') || reasonText.includes('signal is aborted');
      const fromMapbox = reasonText.toLowerCase().includes('mapbox');
      const fromExtension = reasonText.toLowerCase().includes('chrome-extension://');
      if ((isFetchFailure && (fromMapbox || fromExtension)) || isAbortError) {
        event.preventDefault();
        setUseLeafletFallback(true);
        setMapError(
          'Requête Mapbox bloquée. Désactivez le bloqueur de requêtes pour localhost et mapbox.com, puis rechargez la page.',
        );
      }
    };
    window.addEventListener('error', onBrowserError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    (async () => {
      if (styleProbeUrl) {
        try {
          const probe = await fetch(styleProbeUrl);
          if (!probe.ok) throw new Error(`Probe style HTTP ${probe.status}`);
        } catch {
          if (cancelled) return;
          setUseLeafletFallback(true);
          setMapError(
            'Connexion Mapbox bloquée avant initialisation. Autorisez api.mapbox.com puis rechargez la page.',
          );
          return;
        }
      }

      try {
        const map = new mapboxgl.Map({
          container: containerRef.current as HTMLDivElement,
          style,
          center: RENNES_CENTER,
          zoom: 11.2,
          pitch: 58,
          bearing: -18,
          antialias: true,
        });
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');
        map.on('error', (evt) => {
          const msg = evt?.error?.message ?? '';
          if (msg.includes('Failed to fetch') || msg.includes('401') || msg.includes('403') || msg.includes('AbortError')) {
            setUseLeafletFallback(true);
            setMapError(
              'La carte ne peut pas charger ses données. Vérifiez la clé Mapbox et autorisez les requêtes réseau Mapbox.',
            );
          }
        });
        // Note: on évite volontairement le raster-dem/terrain en mode dashboard
        // pour supprimer les AbortError aléatoires en dev/hot-reload.

        const schoolEl = document.createElement('div');
        schoolEl.className = 'mapbox-marker school';
        const schoolPopup = new mapboxgl.Popup({ offset: 16 }).setHTML(
          `<div class="min-w-[180px]">
            <p class="font-semibold text-slate-900">TOTEM Formation</p>
            <p class="text-sm text-slate-600">Cesson-Sevigne (Rennes), France</p>
          </div>`,
        );
        const schoolMarker = new mapboxgl.Marker(schoolEl)
          .setLngLat(TOTEM_CAMPUS)
          .setPopup(schoolPopup)
          .addTo(map);
        schoolMarkerRef.current = schoolMarker;
        mapInstanceRef.current = map;
      } catch {
        if (cancelled) return;
        setUseLeafletFallback(true);
        setMapError(
          'Initialisation Mapbox impossible. Vérifiez NEXT_PUBLIC_MAPBOX_TOKEN, NEXT_PUBLIC_MAPBOX_STYLE et la connexion.',
        );
      }
    })();

    return () => {
      cancelled = true;
      const map = mapInstanceRef.current;
      // En mode dev (Fast Refresh/StrictMode), ce cleanup peut être appelé
      // pendant un cycle interne Mapbox encore en cours: on ignore l'abort.
      try {
        markersRef.current.forEach((m) => m.remove());
      } catch {}
      markersRef.current = [];
      try {
        schoolMarkerRef.current?.remove();
      } catch {}
      schoolMarkerRef.current = null;
        mapInstanceRef.current = null;
      // En dev, map.remove() peut remonter AbortError via internals Mapbox + hot reload.
      // On évite ce remove agressif en dev pour empêcher l'écran runtime rouge.
      if (process.env.NODE_ENV === 'production') {
        try {
          map?.remove();
        } catch {}
      }
      window.removeEventListener('error', onBrowserError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filteredPoints.forEach((p) => {
      const el = document.createElement('div');
      el.className = `mapbox-marker ${p.kind}`;
      const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(
        `<div class="min-w-[180px]">
          <p class="font-semibold text-slate-800">${escapeHtml(p.title)}</p>
          <p class="text-sm text-slate-600">${escapeHtml(p.subtitle)}</p>
          <p class="text-xs text-slate-500">${escapeHtml(p.city)}</p>
          ${p.score == null ? '' : `<p class="text-xs text-slate-700 mt-1">Score matching: <strong>${p.score}%</strong></p>`}
          <a href="${p.href}" class="inline-block mt-2 text-sm text-teal-600 hover:underline">Voir la fiche →</a>
        </div>`,
      );
      if (p.score != null) {
        el.style.width = '15px';
        el.style.height = '15px';
        el.style.boxShadow = '0 0 0 4px rgba(15,23,42,0.12), 0 3px 10px rgba(0,0,0,0.28)';
      }
      const marker = new mapboxgl.Marker(el).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map);
      el.addEventListener('click', () => {
        map.flyTo({ center: [p.lng, p.lat], zoom: 14, speed: 0.9, pitch: 60 });
      });
      markersRef.current.push(marker);
    });

    if (filteredPoints.length > 1) {
      const bounds = new LngLatBounds();
      filteredPoints.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 700 });
    } else if (filteredPoints.length === 1) {
      const p = filteredPoints[0];
      map.flyTo({ center: [p.lng, p.lat], zoom: 14, speed: 0.9, pitch: 60 });
    } else {
      map.flyTo({ center: RENNES_CENTER, zoom: 10, speed: 0.8, pitch: 58, bearing: -18 });
    }
  }, [filteredPoints]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const sourceId = 'matching-lines-source';
    const layerId = 'matching-lines-layer';

    const data = {
      type: 'FeatureCollection',
      features: lineLinks.map((l) => ({
        type: 'Feature',
        properties: { score: l.score },
        geometry: {
          type: 'LineString',
          coordinates: [l.from, l.to],
        },
      })),
    } as GeoJSON.FeatureCollection<GeoJSON.LineString, { score: number }>;

    const upsertLines = () => {
      const existing = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
      if (existing) {
        existing.setData(data);
        return;
      }
      map.addSource(sourceId, { type: 'geojson', data });
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#0f172a',
          'line-width': ['interpolate', ['linear'], ['get', 'score'], 40, 1.5, 100, 4.5],
          'line-opacity': 0.35,
        },
      });
    };

    if (map.isStyleLoaded()) upsertLines();
    else map.once('style.load', upsertLines);
  }, [lineLinks]);

  const hasToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  return (
    <div className="totem-map-wrap relative rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="absolute left-4 top-4 z-10 w-[min(520px,calc(100%-2rem))] rounded-xl border border-slate-200 bg-white/95 backdrop-blur p-3 shadow-lg">
        <div className="flex flex-wrap gap-2 mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher étudiant, entreprise, ville, secteur..."
            className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-700"
          />
          <button
            type="button"
            onClick={() => setSearchType('all')}
            className={`px-3 py-2 rounded-lg text-xs font-medium ${searchType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Tout
          </button>
          <button
            type="button"
            onClick={() => setSearchType('candidate')}
            className={`px-3 py-2 rounded-lg text-xs font-medium ${searchType === 'candidate' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Étudiants
          </button>
          <button
            type="button"
            onClick={() => setSearchType('company')}
            className={`px-3 py-2 rounded-lg text-xs font-medium ${searchType === 'company' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Entreprises
          </button>
        </div>
        <p className="text-xs text-slate-500">
          {filteredPoints.length} résultat(s) — Vue 3D centrée Rennes, navigation Mapbox GL.
        </p>
      </div>

      {!hasToken ? (
        <div className="h-[560px] flex items-center justify-center text-sm text-amber-700 bg-amber-50">
          Mapbox non configuré: ajoutez NEXT_PUBLIC_MAPBOX_TOKEN dans apps/web/.env.local
        </div>
      ) : useLeafletFallback ? (
        <div className="h-[560px] relative">
          <iframe
            title="Carte fallback Rennes"
            className="w-full h-full rounded-xl border-0"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-1.85%2C48.00%2C-1.45%2C48.24&layer=mapnik&marker=48.1184%2C-1.6075"
          />
          {mapError ? (
            <div className="absolute right-4 top-4 z-20 rounded-lg border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs text-amber-900 shadow">
              {mapError}
            </div>
          ) : null}
          <div className="absolute left-4 bottom-4 z-20 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow max-w-[320px]">
            <p className="font-semibold text-slate-900 mb-1">Mode carte de secours</p>
            <p>
              La carte interactive Mapbox est bloquée par le navigateur. Les recherches et le matching restent actifs dans le panneau.
            </p>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-[560px] z-0 rounded-xl" />
      )}
      <div className="absolute bottom-4 left-4 flex gap-3 bg-white/95 backdrop-blur rounded-lg shadow-md px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 border border-white shadow" />
          Candidats
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 border border-white shadow" />
          Entreprises
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white shadow" />
          TOTEM Formation
        </span>
      </div>
    </div>
  );
}

function normalizeMapboxStyle(rawStyle: string): string {
  if (rawStyle.startsWith('mapbox://styles/')) return rawStyle;
  if (rawStyle.startsWith('http://') || rawStyle.startsWith('https://')) return rawStyle;
  return `mapbox://styles/${rawStyle}`;
}

function buildMapboxStyleProbeUrl(rawStyle: string, token: string): string | null {
  if (rawStyle.startsWith('http://') || rawStyle.startsWith('https://')) return rawStyle;
  const withoutPrefix = rawStyle
    .replace('mapbox://styles/', '')
    .replace(/^\/+/, '');
  if (!withoutPrefix.includes('/')) return null;
  return `https://api.mapbox.com/styles/v1/${withoutPrefix}?access_token=${encodeURIComponent(token)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
