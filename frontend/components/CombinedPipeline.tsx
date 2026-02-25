'use client';

import { useState } from 'react';
import { Lead } from '../api/contacts.api';

interface CombinedPipelineProps {
  leads: Lead[];
}

export default function CombinedPipeline({ leads }: CombinedPipelineProps) {
  const [viewMode, setViewMode] = useState<'columns' | 'table'>('columns');
  const statuses = [
    { id: 'nouveau', label: 'Nouveau', icon: '🆕', color: '#3b82f6' },
    { id: 'en cours', label: 'En Cours', icon: '⚙️', color: '#eab308' },
    { id: 'converti', label: 'Converti', icon: '✅', color: '#22c55e' },
    { id: 'perdu', label: 'Perdu', icon: '❌', color: '#ef4444' },
  ];

  // Calculer les stats par étape
  const stats = statuses.map((status) => {
    const count = leads.filter((l) => l.status === status.id).length;
    const value = leads
      .filter((l) => l.status === status.id)
      .reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0);
    return {
      ...status,
      count,
      value,
    };
  });

  // Taux de conversion
  const conversionRates = stats.map((status, index) => {
    if (index === 0) return { rate: 100, label: '100%' };
    const prevCount = stats[index - 1].count;
    const currentCount = status.count;
    if (prevCount === 0) return { rate: 0, label: '0%' };
    const rate = (currentCount / prevCount) * 100;
    return { rate, label: `${rate.toFixed(1)}%` };
  });

  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const totalValue = leads.reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header avec valeur totale */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Pipeline de Vente</h2>
        <div className="text-right">
          <p className="text-sm text-slate-600">Valeur totale du pipeline</p>
          <p className="text-3xl font-bold text-blue-600">{totalValue.toLocaleString()} €</p>
        </div>
      </div>

      {/* Switch entre visualisations */}
      <div className="flex gap-3 bg-slate-100 p-2 rounded-lg w-fit">
        <button
          onClick={() => setViewMode('columns')}
          className={`px-4 py-2 rounded-md font-semibold transition-all ${
            viewMode === 'columns'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-slate-700 hover:bg-slate-200'
          }`}
        >
          📊 Colonnes
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded-md font-semibold transition-all ${
            viewMode === 'table'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-slate-700 hover:bg-slate-200'
          }`}
        >
          📋 Tableau
        </button>
      </div>

      {/* Colonnes avec stats (Kanban + visuel) */}
      {viewMode === 'columns' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((status, index) => (
          <div
            key={status.id}
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-l-4"
            style={{ borderLeftColor: status.color }}
          >
            {/* Header de colonne */}
            <div className="mb-4 pb-4 border-b">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{status.icon}</span>
                <h3 className="font-bold text-slate-900">{status.label}</h3>
              </div>
              <p className="text-sm text-slate-600">
                {status.count} lead{status.count !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Stats principales */}
            <div className="space-y-3 mb-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-slate-600 mb-1">Valeur totale</p>
                <p className="text-lg font-bold text-slate-900">
                  {status.value.toLocaleString()} €
                </p>
              </div>
              {status.count > 0 && (
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Valeur moyenne</p>
                  <p className="text-lg font-bold text-blue-600">
                    {(status.value / status.count).toLocaleString()} €
                  </p>
                </div>
              )}
            </div>

            {/* Taux de conversion */}
            {index > 0 && (
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-600 mb-1">Taux de conversion</p>
                <p className="text-lg font-bold" style={{ color: status.color }}>
                  {conversionRates[index].label}
                </p>
              </div>
            )}

            {/* Barre visuelle de progression */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-slate-500 mb-2">Proportion du pipeline</div>
              <div className="h-2 bg-slate-300 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: status.color,
                    width: `${(status.count / maxCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Tableau récapitulatif détaillé */}
      {viewMode === 'table' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800">Tableau récapitulatif</h3>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Étape</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Leads</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Valeur totale</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Valeur moyenne</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((status, index) => (
                <tr key={status.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="font-semibold text-slate-900">{status.label}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">{status.count}</td>
                  <td className="text-center py-3 px-4 font-semibold text-slate-900">
                    {status.value.toLocaleString()} €
                  </td>
                  <td className="text-center py-3 px-4">
                    {status.count > 0 ? (status.value / status.count).toLocaleString() + ' €' : '-'}
                  </td>
                  <td className="text-center py-3 px-4 font-semibold" style={{ color: status.color }}>
                    {conversionRates[index].label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* KPIs clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <p className="text-sm text-slate-600 mb-2">Taux de conversion global</p>
          <p className="text-3xl font-bold text-blue-600">
            {stats[0].count > 0 ? ((stats[3].count / stats[0].count) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-xs text-slate-600 mt-2">
            {stats[3].count} conv. sur {stats[0].count} prospects
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <p className="text-sm text-slate-600 mb-2">Valeur gagnée</p>
          <p className="text-3xl font-bold text-green-600">
            {stats[2].value.toLocaleString()} €
          </p>
          <p className="text-xs text-slate-600 mt-2">Leads convertis ({stats[2].count})</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
          <p className="text-sm text-slate-600 mb-2">Valeur en jeu</p>
          <p className="text-3xl font-bold text-yellow-600">
            {(stats[0].value + stats[1].value).toLocaleString()} €
          </p>
          <p className="text-xs text-slate-600 mt-2">Nouveau + En cours</p>
        </div>
      </div>
    </div>
  );
}
