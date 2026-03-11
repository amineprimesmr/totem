'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-[#1a1a1a] rounded-xl animate-pulse border border-white/10" />,
});

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

interface MapData {
  candidates: MapCandidate[];
  companies: MapCompany[];
}

interface OfferLite {
  id: string;
  company: { id: string };
}

interface CandidateSuggestion {
  offerId: string;
  score: number;
  distanceKm: number | null;
}

interface OfferSuggestion {
  candidateId: string;
  score: number;
  distanceKm: number | null;
}

type MatchMode = 'candidate_to_company' | 'company_to_candidate';

interface MatchResult {
  id: string;
  label: string;
  subtitle: string;
  score: number;
  distanceKm: number | null;
}

interface LineLink {
  from: [number, number];
  to: [number, number];
  score: number;
}

interface CampaignPreviewItem {
  candidateId: string;
  offerId: string;
  companyId: string;
  score: number;
  distanceKm: number | null;
  recipientEmail: string | null;
  label: string;
}

interface CampaignPreviewResponse {
  direction: 'CANDIDATE_TO_COMPANIES' | 'COMPANY_TO_CANDIDATES';
  selectedEntityId: string;
  total: number;
  items: CampaignPreviewItem[];
}

interface CampaignItemStatus {
  id: string;
  status: 'QUEUED' | 'SENT' | 'CLICKED' | 'YES' | 'NO' | 'ERROR';
  errorMessage: string | null;
  score: number | null;
  candidate?: { firstName: string; lastName: string } | null;
  company?: { name: string } | null;
  offer?: { title: string } | null;
}

interface CampaignResponse {
  id: string;
  name: string;
  sentCount: number;
  yesCount: number;
  noCount: number;
  errorCount: number;
  itemCount: number;
  items: CampaignItemStatus[];
}

function groupByCity<T extends { city: string | null }>(items: T[]) {
  const byCity: Record<string, T[]> = {};
  for (const item of items) {
    const city = item.city?.trim() || 'Non renseigné';
    if (!byCity[city]) byCity[city] = [];
    byCity[city].push(item);
  }
  return Object.entries(byCity).sort((a, b) => b[1].length - a[1].length);
}

export default function MapPage() {
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<MatchMode>('candidate_to_company');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [highlightCandidateScores, setHighlightCandidateScores] = useState<Record<string, number>>({});
  const [highlightCompanyScores, setHighlightCompanyScores] = useState<Record<string, number>>({});
  const [lineLinks, setLineLinks] = useState<LineLink[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [campaignPreview, setCampaignPreview] = useState<CampaignPreviewResponse | null>(null);
  const [currentCampaign, setCurrentCampaign] = useState<CampaignResponse | null>(null);

  useEffect(() => {
    refreshMapData().finally(() => setLoading(false));
  }, []);

  async function refreshMapData() {
    return api<MapData>('/dashboard/map-data')
      .then(setData)
      .catch(() => setData({ candidates: [], companies: [] }));
  }

  async function loadRennesDemoData() {
    setDemoLoading(true);
    setDemoMessage(null);
    try {
      const res = await api<{ message?: string; created?: Record<string, number> }>('/demo/load', {
        method: 'POST',
      });
      await refreshMapData();
      const created = res.created
        ? `${res.created.candidates ?? 0} étudiants, ${res.created.companies ?? 0} entreprises, ${res.created.offers ?? 0} offres`
        : 'Données chargées';
      setDemoMessage(`Jeu de test Rennes chargé: ${created}.`);
    } catch (e) {
      setDemoMessage(e instanceof Error ? e.message : 'Impossible de charger les données de test.');
    } finally {
      setDemoLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Carte</h1>
        <div className="h-[500px] bg-white rounded-xl animate-pulse border border-slate-200" />
      </div>
    );
  }

  const candidatesWithCoords = (data?.candidates ?? []).filter(
    (c) => c.latitude != null && c.longitude != null,
  );
  const companiesWithCoords = (data?.companies ?? []).filter(
    (c) => c.latitude != null && c.longitude != null,
  );
  const candidatesByCity = groupByCity(data?.candidates ?? []);
  const companiesByCity = groupByCity(data?.companies ?? []);
  const candidates = data?.candidates ?? [];
  const companies = data?.companies ?? [];

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  async function runMatching() {
    setMatchError(null);
    setMatchingLoading(true);
    setMatchResults([]);
    setHighlightCandidateScores({});
    setHighlightCompanyScores({});
    setLineLinks([]);

    try {
      if (mode === 'candidate_to_company') {
        if (!selectedCandidateId) throw new Error('Sélectionnez un étudiant.');
        const suggestions = await api<CandidateSuggestion[]>(`/matches/suggestions/candidate/${selectedCandidateId}`);
        if (suggestions.length === 0) {
          setMatchResults([]);
          return;
        }

        const offers = await api<OfferLite[]>('/offers?status=ACTIVE&pageSize=100');
        const offerCompanyMap = new Map<string, string>(offers.map((o) => [o.id, o.company.id]));

        const companyAgg = new Map<string, { score: number; distanceKm: number | null }>();
        suggestions.forEach((s) => {
          const companyId = offerCompanyMap.get(s.offerId);
          if (!companyId) return;
          const current = companyAgg.get(companyId);
          if (!current || s.score > current.score) {
            companyAgg.set(companyId, { score: s.score, distanceKm: s.distanceKm });
          }
        });

        const results: MatchResult[] = Array.from(companyAgg.entries())
          .map(([companyId, v]) => {
            const company = companies.find((c) => c.id === companyId);
            if (!company) return null;
            return {
              id: companyId,
              label: company.name,
              subtitle: `${company.sector} — ${company.city ?? 'Ville inconnue'}`,
              score: v.score,
              distanceKm: v.distanceKm,
            };
          })
          .filter((v): v is MatchResult => Boolean(v))
          .sort((a, b) => b.score - a.score)
          .slice(0, 30);

        const scoreMap: Record<string, number> = {};
        results.forEach((r) => (scoreMap[r.id] = r.score));
        setHighlightCompanyScores(scoreMap);

        if (selectedCandidate?.latitude != null && selectedCandidate?.longitude != null) {
          const lines: LineLink[] = results
            .map((r) => {
              const company = companies.find((c) => c.id === r.id);
              if (!company || company.latitude == null || company.longitude == null) return null;
              return {
                from: [selectedCandidate.longitude, selectedCandidate.latitude] as [number, number],
                to: [company.longitude, company.latitude] as [number, number],
                score: r.score,
              };
            })
            .filter((v): v is LineLink => Boolean(v));
          setLineLinks(lines);
        }

        setMatchResults(results);
        return;
      }

      if (!selectedCompanyId) throw new Error('Sélectionnez une entreprise.');
      const offers = await api<OfferLite[]>(`/offers?companyId=${selectedCompanyId}&status=ACTIVE&pageSize=100`);
      if (offers.length === 0) {
        setMatchResults([]);
        return;
      }

      const raw = await Promise.all(
        offers.map((o) => api<OfferSuggestion[]>(`/matches/suggestions/offer/${o.id}`)),
      );
      const candidateAgg = new Map<string, { score: number; distanceKm: number | null }>();

      raw.flat().forEach((s) => {
        const current = candidateAgg.get(s.candidateId);
        if (!current || s.score > current.score) {
          candidateAgg.set(s.candidateId, { score: s.score, distanceKm: s.distanceKm });
        }
      });

      const results: MatchResult[] = Array.from(candidateAgg.entries())
        .map(([candidateId, v]) => {
          const candidate = candidates.find((c) => c.id === candidateId);
          if (!candidate) return null;
          return {
            id: candidateId,
            label: `${candidate.firstName} ${candidate.lastName}`,
            subtitle: `${candidate.formation} — ${candidate.city ?? 'Ville inconnue'}`,
            score: v.score,
            distanceKm: v.distanceKm,
          };
        })
        .filter((v): v is MatchResult => Boolean(v))
        .sort((a, b) => b.score - a.score)
        .slice(0, 30);

      const scoreMap: Record<string, number> = {};
      results.forEach((r) => (scoreMap[r.id] = r.score));
      setHighlightCandidateScores(scoreMap);

      if (selectedCompany?.latitude != null && selectedCompany?.longitude != null) {
        const lines: LineLink[] = results
          .map((r) => {
            const candidate = candidates.find((c) => c.id === r.id);
            if (!candidate || candidate.latitude == null || candidate.longitude == null) return null;
            return {
              from: [selectedCompany.longitude, selectedCompany.latitude] as [number, number],
              to: [candidate.longitude, candidate.latitude] as [number, number],
              score: r.score,
            };
          })
          .filter((v): v is LineLink => Boolean(v));
        setLineLinks(lines);
      }

      setMatchResults(results);
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : 'Erreur matching');
    } finally {
      setMatchingLoading(false);
    }
  }

  async function previewCampaign() {
    const selectedEntityId =
      mode === 'candidate_to_company' ? selectedCandidateId : selectedCompanyId;
    if (!selectedEntityId) {
      setCampaignError(
        mode === 'candidate_to_company'
          ? 'Sélectionnez un étudiant.'
          : 'Sélectionnez une entreprise.',
      );
      return;
    }
    setCampaignError(null);
    setCampaignLoading(true);
    try {
      const payload = {
        direction:
          mode === 'candidate_to_company'
            ? 'CANDIDATE_TO_COMPANIES'
            : 'COMPANY_TO_CANDIDATES',
        selectedEntityId,
        maxItems: 30,
      };
      const res = await api<CampaignPreviewResponse>('/messages/campaigns/preview', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCampaignPreview(res);
    } catch (e) {
      setCampaignError(e instanceof Error ? e.message : 'Erreur preview campagne');
    } finally {
      setCampaignLoading(false);
    }
  }

  async function sendCampaign() {
    const selectedEntityId =
      mode === 'candidate_to_company' ? selectedCandidateId : selectedCompanyId;
    if (!selectedEntityId) {
      setCampaignError(
        mode === 'candidate_to_company'
          ? 'Sélectionnez un étudiant.'
          : 'Sélectionnez une entreprise.',
      );
      return;
    }
    setCampaignError(null);
    setCampaignLoading(true);
    try {
      const payload = {
        direction:
          mode === 'candidate_to_company'
            ? 'CANDIDATE_TO_COMPANIES'
            : 'COMPANY_TO_CANDIDATES',
        selectedEntityId,
        maxItems: 30,
      };
      const res = await api<CampaignResponse>('/messages/campaigns/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCurrentCampaign(res);
      setCampaignPreview(null);
    } catch (e) {
      setCampaignError(e instanceof Error ? e.message : 'Erreur envoi campagne');
    } finally {
      setCampaignLoading(false);
    }
  }

  async function retryFailed() {
    if (!currentCampaign) return;
    setCampaignLoading(true);
    setCampaignError(null);
    try {
      const res = await api<CampaignResponse>(`/messages/campaigns/${currentCampaign.id}/retry-failed`, {
        method: 'POST',
      });
      setCurrentCampaign(res);
    } catch (e) {
      setCampaignError(e instanceof Error ? e.message : 'Erreur relance campagne');
    } finally {
      setCampaignLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Carte</h1>
        <p className="text-slate-500 mt-1">
          Carte Mapbox 3D centrée sur Rennes, recherche intégrée étudiants/entreprises, et navigation sur fiches depuis les marqueurs.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadRennesDemoData}
            disabled={demoLoading}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
          >
            {demoLoading ? 'Chargement…' : 'Charger données de test Rennes'}
          </button>
          <button
            type="button"
            onClick={() => refreshMapData()}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Rafraîchir la carte
          </button>
        </div>
        {demoMessage ? <p className="text-xs mt-2 text-slate-600">{demoMessage}</p> : null}
        {(candidatesWithCoords.length === 0 && companiesWithCoords.length === 0) && (
          <p className="text-amber-700 text-sm mt-2">
            Aucune fiche n&apos;a de latitude/longitude renseignées. Renseignez-les dans les fiches candidat et entreprise pour les afficher sur la carte.
          </p>
        )}
      </div>

      <MapView
        candidates={data?.candidates ?? []}
        companies={data?.companies ?? []}
        highlightCandidateScores={highlightCandidateScores}
        highlightCompanyScores={highlightCompanyScores}
        lineLinks={lineLinks}
      />

      <section className="bg-white rounded-[14px] border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('candidate_to_company');
              setMatchResults([]);
              setLineLinks([]);
              setHighlightCandidateScores({});
              setHighlightCompanyScores({});
            }}
            className={`px-3 py-2 rounded-lg text-xs font-medium ${
              mode === 'candidate_to_company' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Trouver entreprises qualifiées pour un étudiant
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('company_to_candidate');
              setMatchResults([]);
              setLineLinks([]);
              setHighlightCandidateScores({});
              setHighlightCompanyScores({});
            }}
            className={`px-3 py-2 rounded-lg text-xs font-medium ${
              mode === 'company_to_candidate' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Trouver étudiants qualifiés pour une entreprise
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {mode === 'candidate_to_company' ? (
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="min-w-[320px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un étudiant</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} — {c.formation}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="min-w-[320px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sélectionner une entreprise</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.sector}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={runMatching}
            disabled={matchingLoading}
            className="px-4 py-2 rounded-lg bg-totem-accent text-white text-sm font-semibold hover:bg-totem-accent-hover disabled:opacity-60"
          >
            {matchingLoading ? 'Calcul en cours…' : 'Lancer le matching'}
          </button>
        </div>

        {matchError && <p className="text-sm text-red-600">{matchError}</p>}
        {!matchError && matchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              Top {Math.min(30, matchResults.length)} résultats qualifiés
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {matchResults.slice(0, 12).map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{r.label}</p>
                    <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-totem-accent">{r.score}%</p>
                    <p className="text-[11px] text-slate-500">
                      {r.distanceKm == null ? 'Distance n/a' : `${Math.round(r.distanceKm)} km`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="bg-white rounded-[14px] border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Campagnes matching email</h2>
            <p className="text-xs text-slate-500">
              Envoi semi-automatique des propositions avec réponse Oui/Non en 1 clic.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={previewCampaign}
              disabled={campaignLoading}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
            >
              {campaignLoading ? 'Chargement…' : 'Prévisualiser'}
            </button>
            <button
              type="button"
              onClick={sendCampaign}
              disabled={campaignLoading}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              Envoyer propositions
            </button>
          </div>
        </div>

        {campaignError ? <p className="text-sm text-red-600">{campaignError}</p> : null}

        {campaignPreview ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              Prévisualisation ({campaignPreview.total} envoi{campaignPreview.total > 1 ? 's' : ''})
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {campaignPreview.items.slice(0, 12).map((it) => (
                <li key={`${it.candidateId}-${it.offerId}`} className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900 truncate">{it.label}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {it.recipientEmail ?? 'Aucun destinataire'} — score {it.score}%
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {currentCampaign ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">Envoyés: {currentCampaign.sentCount}</span>
              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">Oui: {currentCampaign.yesCount}</span>
              <span className="px-2 py-1 rounded bg-amber-100 text-amber-700">Non: {currentCampaign.noCount}</span>
              <span className="px-2 py-1 rounded bg-rose-100 text-rose-700">Erreurs: {currentCampaign.errorCount}</span>
              <button
                type="button"
                onClick={retryFailed}
                disabled={campaignLoading || currentCampaign.errorCount === 0}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
              >
                Relancer les erreurs
              </button>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentCampaign.items.slice(0, 12).map((it) => (
                <li key={it.id} className="rounded-xl border border-slate-200 px-3 py-2 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {it.company?.name ?? ''} {it.offer?.title ? `— ${it.offer.title}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {it.candidate?.firstName} {it.candidate?.lastName} • {it.status}
                    {it.errorMessage ? ` • ${it.errorMessage}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[14px] border border-slate-200 overflow-hidden"
        >
          <h2 className="px-6 py-4 bg-totem-accent/10 border-b border-slate-200 font-semibold text-slate-900">
            Candidats par ville ({data?.candidates.length ?? 0})
          </h2>
          <ul className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto">
            {candidatesByCity.map(([city, list]) => (
              <li key={city} className="px-6 py-3">
                <p className="text-sm font-medium text-slate-500 mb-2">{city}</p>
                <ul className="space-y-1">
                  {list.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/dashboard/candidates/${c.id}`}
                        className="text-sm text-totem-accent hover:underline"
                      >
                        {c.firstName} {c.lastName} — {c.formation}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {candidatesByCity.length === 0 && (
              <li className="px-6 py-8 text-center text-slate-500">Aucun candidat</li>
            )}
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-[14px] border border-slate-200 overflow-hidden"
        >
          <h2 className="px-6 py-4 bg-totem-accent/10 border-b border-slate-200 font-semibold text-slate-900">
            Entreprises par ville ({data?.companies.length ?? 0})
          </h2>
          <ul className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto">
            {companiesByCity.map(([city, list]) => (
              <li key={city} className="px-6 py-3">
                <p className="text-sm font-medium text-slate-500 mb-2">{city}</p>
                <ul className="space-y-1">
                  {list.map((co) => (
                    <li key={co.id}>
                      <Link
                        href={`/dashboard/companies/${co.id}`}
                        className="text-sm text-totem-accent hover:underline"
                      >
                        {co.name} — {co.sector}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {companiesByCity.length === 0 && (
              <li className="px-6 py-8 text-center text-slate-500">Aucune entreprise</li>
            )}
          </ul>
        </motion.section>
      </div>

    </div>
  );
}
