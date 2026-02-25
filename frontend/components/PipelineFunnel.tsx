'use client';

import { Lead } from '../api/contacts.api';

interface PipelineFunnelProps {
  leads: Lead[];
}

export default function PipelineFunnel({ leads }: PipelineFunnelProps) {
  const statuses = [
    { id: 'nouveau', label: 'Nouveau', color: '#3b82f6' },
    { id: 'en cours', label: 'En Cours', color: '#eab308' },
    { id: 'converti', label: 'Converti', color: '#22c55e' },
    { id: 'perdu', label: 'Perdu', color: '#ef4444' },
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

  // Max pour calculer les pourcentages
  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const maxValue = Math.max(...stats.map((s) => s.value), 1);

  // Calculer les taux de conversion
  const conversionRates = stats.map((status, index) => {
    if (index === 0) return { rate: 100, label: '100%' };
    const prevCount = stats[index - 1].count;
    const currentCount = status.count;
    if (prevCount === 0) return { rate: 0, label: '0%' };
    const rate = (currentCount / prevCount) * 100;
    return { rate, label: `${rate.toFixed(1)}%` };
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Analyse du Funnel de Conversion</h2>

        {/* Graphique Entonnoir */}
        <div className="space-y-6">
          {stats.map((status, index) => {
            const widthPercent = (status.count / maxCount) * 100;
            const opacity = 1 - index * 0.1;

            return (
              <div key={status.id} className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <h3 className="font-semibold text-slate-800">{status.label}</h3>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-slate-600">
                      <span className="font-bold text-slate-900">{status.count}</span> lead{status.count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-600">
                      <span className="font-bold text-slate-900">{status.value.toLocaleString()}</span> €
                    </span>
                    {index > 0 && (
                      <span className="text-slate-600">
                        Conversion: <span className="font-bold" style={{ color: status.color }}>
                          {conversionRates[index].label}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Barre entonnoir */}
                <div className="flex justify-center">
                  <div
                    className="h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-all hover:shadow-lg"
                    style={{
                      backgroundColor: status.color,
                      width: `${Math.max(widthPercent, 10)}%`,
                      opacity,
                    }}
                  >
                    {widthPercent > 15 && `${status.count}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="border-t pt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Statistiques détaillées</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Étape</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Nombre de leads</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Valeur totale</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Valeur moyenne</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-700">Taux de conversion</th>
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
                      {status.label}
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 font-semibold text-slate-900">
                    {status.count}
                  </td>
                  <td className="text-center py-3 px-4 font-semibold text-slate-900">
                    {status.value.toLocaleString()} €
                  </td>
                  <td className="text-center py-3 px-4 text-slate-600">
                    {status.count > 0 ? `${(status.value / status.count).toLocaleString()} €` : '-'}
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

      {/* KPIs clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-2">Taux de conversion global</p>
          <p className="text-3xl font-bold text-blue-600">
            {stats[3].count > 0
              ? ((stats[3].count / stats[0].count) * 100).toFixed(1)
              : '0'}
            %
          </p>
          <p className="text-xs text-slate-600 mt-2">
            {stats[3].count} conv. sur {stats[0].count} prospects
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-2">Valeur moyenne du pipeline</p>
          <p className="text-3xl font-bold text-green-600">
            {stats[0].count > 0
              ? (stats[0].value / stats[0].count).toLocaleString()
              : '0'}
            €
          </p>
          <p className="text-xs text-slate-600 mt-2">Par prospect initial</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-2">Valeur gagnée</p>
          <p className="text-3xl font-bold text-purple-600">
            {stats[2].value.toLocaleString()}
            €
          </p>
          <p className="text-xs text-slate-600 mt-2">Leads convertis</p>
        </div>
      </div>
    </div>
  );
}
