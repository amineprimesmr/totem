'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { galiaApi, type GaliaImportType, type GaliaAnalyzeResult, type GaliaSyncResult } from '@/lib/api';
import toast from 'react-hot-toast';

const IMPORT_TYPES: { value: GaliaImportType; label: string }[] = [
  { value: 'candidates', label: 'Candidats' },
  { value: 'companies', label: 'Entreprises' },
  { value: 'formations', label: 'Formations' },
  { value: 'promotions', label: 'Promotions' },
  { value: 'absences', label: 'Absences' },
  { value: 'grades', label: 'Notes' },
  { value: 'documents', label: 'Documents (SIFA/CERFA)' },
];

export default function MigrationPage() {
  const [type, setType] = useState<GaliaImportType>('candidates');
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState<GaliaAnalyzeResult | null>(null);
  const [importResult, setImportResult] = useState<GaliaSyncResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);

  const getCsvContent = (): string => {
    if (csvText.trim()) return csvText;
    return '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setCsvText('');
      const reader = new FileReader();
      reader.onload = () => setCsvText(String(reader.result ?? ''));
      reader.readAsText(f, 'utf-8');
    }
  };

  const handleAnalyze = async () => {
    let content = getCsvContent();
    if (file && !content) {
      content = await file.text();
    }
    if (!content.trim()) {
      toast.error('Choisissez un fichier CSV ou collez le contenu');
      return;
    }
    setAnalyzing(true);
    setImportResult(null);
    try {
      const result = await galiaApi.analyzeCsv(type, content);
      setAnalyzeResult(result);
      if (result.errors.length) toast.error(`${result.errors.length} erreur(s) détectée(s)`);
      else toast.success(`Aperçu: ${result.rowCount} ligne(s), colonnes détectées`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur analyse');
      setAnalyzeResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (file) {
      setImporting(true);
      setImportResult(null);
      try {
        let result: GaliaSyncResult;
        switch (type) {
          case 'candidates':
            result = await galiaApi.importCandidates(file);
            break;
          case 'companies':
            result = await galiaApi.importCompanies(file);
            break;
          case 'formations':
            result = await galiaApi.importFormations(file);
            break;
          case 'promotions':
            result = await galiaApi.importPromotions(file);
            break;
          case 'absences':
            result = await galiaApi.importAbsences(file);
            break;
          case 'grades':
            result = await galiaApi.importGrades(file);
            break;
          case 'documents':
            result = await galiaApi.importDocuments(file);
            break;
          default:
            throw new Error('Type non géré');
        }
        setImportResult(result);
        const created =
          (result.candidatesCreated ?? 0) +
          (result.companiesCreated ?? 0) +
          (result.formationsCreated ?? 0) +
          (result.promotionsCreated ?? 0) +
          (result.absencesCreated ?? 0) +
          (result.gradesCreated ?? 0) +
          (result.documentsCreated ?? 0);
        const updated =
          (result.candidatesUpdated ?? 0) +
          (result.companiesUpdated ?? 0) +
          (result.formationsUpdated ?? 0) +
          (result.promotionsUpdated ?? 0);
        if (result.errors.length) toast.error(`Import terminé avec ${result.errors.length} erreur(s)`);
        else toast.success(`Import OK: ${created} créé(s), ${updated} mis à jour`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur import');
      } finally {
        setImporting(false);
      }
    } else {
      toast.error('Veuillez sélectionner un fichier CSV pour l\'import');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Migration Galia / SC Form</h1>
        <p className="text-sm text-slate-500 mt-1">
          Importer les données depuis des exports CSV (candidats, entreprises, formations, promotions, absences, notes, documents)
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-[14px] border border-slate-200 p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Type d&apos;import</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as GaliaImportType)}
            className="w-full max-w-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
          >
            {IMPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Fichier CSV</label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="block w-full max-w-md text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-totem-accent file:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Ou coller le contenu CSV</label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Collez ici le contenu du CSV..."
            className="w-full h-32 px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || (!file && !csvText.trim())}
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-medium hover:bg-slate-200 disabled:opacity-50"
          >
            {analyzing ? 'Analyse…' : 'Analyser le CSV'}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !file}
            className="px-4 py-2.5 rounded-xl bg-totem-accent text-white font-medium hover:bg-totem-accent-hover disabled:opacity-50"
          >
            {importing ? 'Import…' : 'Importer (fichier)'}
          </button>
        </div>
      </motion.div>

      {analyzeResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-[14px] border border-slate-200 p-6"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-2">Aperçu</h2>
          <p className="text-sm text-slate-600 mb-2">
            {analyzeResult.rowCount} ligne(s) • Colonnes détectées: {Object.entries(analyzeResult.detectedColumns)
              .filter(([, i]) => i >= 0)
              .map(([name]) => name)
              .join(', ')}
          </p>
          {analyzeResult.previewRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-100">
                    {analyzeResult.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analyzeResult.previewRows.map((row, ri) => (
                    <tr key={ri} className="border-t border-slate-200">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-slate-800">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {analyzeResult.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-600">
              {analyzeResult.errors.slice(0, 10).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {analyzeResult.errors.length > 10 && (
                <li>… et {analyzeResult.errors.length - 10} autre(s) erreur(s)</li>
              )}
            </ul>
          )}
        </motion.div>
      )}

      {importResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-[14px] border border-slate-200 p-6"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-2">Résultat de l&apos;import</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {(importResult.candidatesCreated ?? 0) + (importResult.candidatesUpdated ?? 0) > 0 && (
              <span>Candidats: {importResult.candidatesCreated ?? 0} créés, {importResult.candidatesUpdated ?? 0} mis à jour</span>
            )}
            {(importResult.companiesCreated ?? 0) + (importResult.companiesUpdated ?? 0) > 0 && (
              <span>Entreprises: {importResult.companiesCreated ?? 0} créées, {importResult.companiesUpdated ?? 0} mises à jour</span>
            )}
            {(importResult.formationsCreated ?? 0) + (importResult.formationsUpdated ?? 0) > 0 && (
              <span>Formations: {importResult.formationsCreated ?? 0} créées, {importResult.formationsUpdated ?? 0} mises à jour</span>
            )}
            {(importResult.promotionsCreated ?? 0) + (importResult.promotionsUpdated ?? 0) > 0 && (
              <span>Promotions: {importResult.promotionsCreated ?? 0} créées, {importResult.promotionsUpdated ?? 0} mises à jour</span>
            )}
            {(importResult.absencesCreated ?? 0) > 0 && <span>Absences: {importResult.absencesCreated} créées</span>}
            {(importResult.gradesCreated ?? 0) > 0 && <span>Notes: {importResult.gradesCreated} créées</span>}
            {(importResult.documentsCreated ?? 0) > 0 && <span>Documents: {importResult.documentsCreated} créés</span>}
          </div>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-600 max-h-40 overflow-y-auto">
              {importResult.errors.slice(0, 20).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {importResult.errors.length > 20 && (
                <li>… et {importResult.errors.length - 20} autre(s) erreur(s)</li>
              )}
            </ul>
          )}
        </motion.div>
      )}
    </div>
  );
}
