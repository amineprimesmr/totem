'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  schoolingApi,
  organisationApi,
  type Room,
  type Session,
  type Absence,
  type Grade,
  type Document,
  type Promotion,
} from '@/lib/api';

type Tab = 'rooms' | 'sessions' | 'absences' | 'grades' | 'documents';

const SESSION_TYPES: Record<string, string> = {
  COURSE: 'Cours',
  EXAM: 'Examen',
  WORKSHOP: 'Atelier',
  MEETING: 'Réunion',
  OTHER: 'Autre',
};
const ABSENCE_TYPES: Record<string, string> = { ABSENCE: 'Absence', LATE: 'Retard', EXCUSED: 'Justifiée' };
const DOC_TYPES: Record<string, string> = {
  SIFA: 'SIFA',
  CERFA: 'CERFA',
  CONVENTION: 'Convention',
  CONTRACT: 'Contrat',
  BULLETIN: 'Bulletin',
  OTHER: 'Autre',
};

export default function SchoolingPage() {
  const [tab, setTab] = useState<Tab>('sessions');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotionFilter, setPromotionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      schoolingApi.getRooms().then(setRooms),
      organisationApi.getPromotions().then(setPromotions),
      schoolingApi.getSessions({
        promotionId: promotionFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      }).then(setSessions),
      schoolingApi.getAbsences({ from: fromDate || undefined, to: toDate || undefined }).then(setAbsences),
      schoolingApi.getGrades().then(setGrades),
      schoolingApi.getDocuments().then(setDocuments),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [promotionFilter, fromDate, toDate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scolarité</h1>
        <p className="text-sm text-slate-500 mt-1">Planning, salles, absences, notes et documents</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {(['rooms', 'sessions', 'absences', 'grades', 'documents'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-medium ${
              tab === t ? 'bg-white border border-slate-200 border-b-0 -mb-px text-totem-accent' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t === 'rooms' && 'Salles'}
            {t === 'sessions' && 'Planning'}
            {t === 'absences' && 'Absences'}
            {t === 'grades' && 'Notes'}
            {t === 'documents' && 'Documents'}
          </button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={promotionFilter}
            onChange={(e) => setPromotionFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          >
            <option value="">Toutes les promotions</option>
            {promotions.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.year})</option>
            ))}
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="h-64 bg-white rounded-[14px] border border-slate-200 animate-pulse" />
      ) : (
        <>
          {tab === 'rooms' && (
            <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
              <ul className="divide-y divide-slate-200">
                {rooms.map((r) => (
                  <li key={r.id} className="px-6 py-4 flex justify-between">
                    <span className="font-medium text-slate-900">{r.name}</span>
                    <span className="text-sm text-slate-500">
                      {r.building && `${r.building} • `}
                      {r.capacity != null ? `${r.capacity} places` : '—'}
                    </span>
                  </li>
                ))}
              </ul>
              {rooms.length === 0 && <p className="p-8 text-center text-slate-500">Aucune salle</p>}
            </div>
          )}
          {tab === 'sessions' && (
            <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
              <ul className="divide-y divide-slate-200">
                {sessions.map((s) => (
                  <li key={s.id} className="px-6 py-4">
                    <p className="font-medium text-slate-900">{s.title}</p>
                    <p className="text-sm text-slate-500">
                      {s.startAt && new Date(s.startAt).toLocaleString('fr-FR')} → {s.endAt && new Date(s.endAt).toLocaleString('fr-FR')}
                      {s.room && ` • ${s.room.name}`}
                      {s.promotion && ` • ${s.promotion.name}`}
                      {' • '}
                      {SESSION_TYPES[s.type] ?? s.type}
                    </p>
                  </li>
                ))}
              </ul>
              {sessions.length === 0 && <p className="p-8 text-center text-slate-500">Aucune session</p>}
            </div>
          )}
          {tab === 'absences' && (
            <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
              <ul className="divide-y divide-slate-200">
                {absences.map((a) => (
                  <li key={a.id} className="px-6 py-4 flex justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {a.candidate ? `${a.candidate.firstName} ${a.candidate.lastName}` : a.candidateId}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(a.date).toLocaleDateString('fr-FR')} • {ABSENCE_TYPES[a.type] ?? a.type}
                        {a.justified && ' • Justifiée'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {absences.length === 0 && <p className="p-8 text-center text-slate-500">Aucune absence</p>}
            </div>
          )}
          {tab === 'grades' && (
            <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
              <ul className="divide-y divide-slate-200">
                {grades.map((g) => (
                  <li key={g.id} className="px-6 py-4 flex justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {g.candidate ? `${g.candidate.firstName} ${g.candidate.lastName}` : g.candidateId}
                      </p>
                      <p className="text-sm text-slate-500">
                        {g.subject && `${g.subject} • `}
                        {g.label && `${g.label} • `}
                        Barème {g.scale ?? 20}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-totem-accent">{g.value}</span>
                  </li>
                ))}
              </ul>
              {grades.length === 0 && <p className="p-8 text-center text-slate-500">Aucune note</p>}
            </div>
          )}
          {tab === 'documents' && (
            <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
              <ul className="divide-y divide-slate-200">
                {documents.map((d) => (
                  <li key={d.id} className="px-6 py-4 flex justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{d.name}</p>
                      <p className="text-sm text-slate-500">
                        {d.candidate && `${d.candidate.firstName} ${d.candidate.lastName} • `}
                        {DOC_TYPES[d.type] ?? d.type}
                      </p>
                    </div>
                    <a
                      href={d.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-totem-accent hover:underline"
                    >
                      Ouvrir
                    </a>
                  </li>
                ))}
              </ul>
              {documents.length === 0 && <p className="p-8 text-center text-slate-500">Aucun document</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
