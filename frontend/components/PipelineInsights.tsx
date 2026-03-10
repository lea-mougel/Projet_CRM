'use client';

import type { ReactNode } from 'react';
import {
  CircleDollarSign,
  BarChart3,
  Percent,
  Target,
  Sparkles,
  Settings2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Lead } from '../api/contacts.api';

interface PipelineInsightsProps {
  leads: Lead[];
  userRole?: 'admin' | 'commercial' | 'user';
}

export default function PipelineInsights({ leads, userRole = 'user' }: PipelineInsightsProps) {
  // Grouper les leads par statut
  const leadsByStatus = {
    nouveau: leads.filter((l) => l.status === 'nouveau'),
    'en cours': leads.filter((l) => l.status === 'en cours'),
    converti: leads.filter((l) => l.status === 'converti'),
    perdu: leads.filter((l) => l.status === 'perdu'),
  };

  // Grouper les leads par commercial
  const leadsByCommercial = leads.reduce(
    (acc, lead) => {
      const commercial = lead.assigned_commercial?.email || 'Non assigné';
      if (!acc[commercial]) {
        acc[commercial] = [];
      }
      acc[commercial].push(lead);
      return acc;
    },
    {} as Record<string, Lead[]>,
  );

  // Grouper les leads par source
  const leadsBySource = leads.reduce(
    (acc, lead) => {
      const source = lead.source || 'Non spécifiée';
      if (!acc[source]) {
        acc[source] = [];
      }
      acc[source].push(lead);
      return acc;
    },
    {} as Record<string, Lead[]>,
  );

  // Calculs KPI
  const totalValue = leads.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
  const avgValue = leads.length > 0 ? totalValue / leads.length : 0;
  const convertionRate = leads.length > 0 ? (leadsByStatus.converti.length / leadsByStatus.nouveau.length) * 100 : 0;
  const wontValue = leadsByStatus.perdu.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
  const wonValue = leadsByStatus.converti.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);

  return (
    <div className="space-y-8">
      {/* KPIs principaux */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">KPIs Principaux</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Valeur totale du pipeline"
            value={`${totalValue.toLocaleString()} €`}
            icon={<CircleDollarSign className="w-5 h-5" />}
            color="from-blue-50 to-blue-100"
          />
          <KPICard
            title="Valeur moyenne"
            value={`${avgValue.toLocaleString()} €`}
            icon={<BarChart3 className="w-5 h-5" />}
            color="from-green-50 to-green-100"
          />
          <KPICard
            title="Taux de conversion"
            value={`${convertionRate.toFixed(1)}%`}
            icon={<Percent className="w-5 h-5" />}
            color="from-purple-50 to-purple-100"
          />
          <KPICard
            title="Nombre total de leads"
            value={leads.length}
            icon={<Target className="w-5 h-5" />}
            color="from-yellow-50 to-yellow-100"
          />
        </div>
      </div>

      {/* Distribution par étape */}
      <div className="border-t pt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Distribution par étape</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="Nouveau"
            count={leadsByStatus.nouveau.length}
            value={leadsByStatus.nouveau.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0)}
            color="#3b82f6"
            icon={<Sparkles className="w-5 h-5" />}
          />
          <StatusCard
            title="En Cours"
            count={leadsByStatus['en cours'].length}
            value={leadsByStatus['en cours'].reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0)}
            color="#eab308"
            icon={<Settings2 className="w-5 h-5" />}
          />
          <StatusCard
            title="Converti"
            count={leadsByStatus.converti.length}
            value={leadsByStatus.converti.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0)}
            color="#22c55e"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatusCard
            title="Perdu"
            count={leadsByStatus.perdu.length}
            value={leadsByStatus.perdu.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0)}
            color="#ef4444"
            icon={<XCircle className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Détails par commercial - visible seulement pour les admins */}
      {userRole === 'admin' && (
        <div className="border-t pt-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Performance par commercial</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Commercial</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Leads</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Valeur totale</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Valeur moyenne</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Convertis</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(leadsByCommercial)
                  .sort((a, b) => {
                    const valueA = a[1].reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
                    const valueB = b[1].reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
                    return valueB - valueA;
                  })
                  .map(([commercial, leadsForCommercial]) => {
                    const value = leadsForCommercial.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
                    const converted = leadsForCommercial.filter((l) => l.status === 'converti').length;
                    return (
                      <tr key={commercial} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{commercial}</td>
                        <td className="text-center py-3 px-4">{leadsForCommercial.length}</td>
                        <td className="text-center py-3 px-4 font-semibold text-slate-900">
                          {value.toLocaleString()} €
                        </td>
                        <td className="text-center py-3 px-4 text-slate-600">
                          {leadsForCommercial.length > 0 ? `${(value / leadsForCommercial.length).toLocaleString()} €` : '-'}
                        </td>
                        <td className="text-center py-3 px-4 font-semibold text-green-600">{converted}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sources de leads */}
      <div className="border-t pt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Répartition par source</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(leadsBySource)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([source, leadsForSource]) => {
              const value = leadsForSource.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
              const percentage = ((leadsForSource.length / leads.length) * 100).toFixed(1);
              return (
                <div
                  key={source}
                  className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 border border-slate-200"
                >
                  <h4 className="font-semibold text-slate-900 mb-3">{source}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Leads:</span>
                      <span className="font-bold">{leadsForSource.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pourcentage:</span>
                      <span className="font-bold text-blue-600">{percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valeur:</span>
                      <span className="font-bold">{value.toLocaleString()} €</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Résumé financier */}
      <div className="border-t pt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Résumé financier</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <p className="text-sm text-slate-700 mb-2">Valeur gagnée (Converti)</p>
            <p className="text-3xl font-bold text-green-600">{wonValue.toLocaleString()} €</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
            <p className="text-sm text-slate-700 mb-2">Valeur perdue</p>
            <p className="text-3xl font-bold text-red-600">{wontValue.toLocaleString()} €</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <p className="text-sm text-slate-700 mb-2">Valeur en jeu</p>
            <p className="text-3xl font-bold text-blue-600">
              {(
                leadsByStatus['en cours'].reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0) +
                leadsByStatus.nouveau.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0)
              ).toLocaleString()}
              €
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composants réutilisables

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

function KPICard({ title, value, icon, color }: KPICardProps) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-6 border border-slate-200`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-600">{title}</p>
        <span className="text-slate-700">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

interface StatusCardProps {
  title: string;
  count: number;
  value: number;
  color: string;
  icon: ReactNode;
}

function StatusCard({ title, count, value, color, icon }: StatusCardProps) {
  return (
    <div className="border-l-4 rounded-lg p-6 bg-white" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-900">{title}</h4>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Leads:</span>
          <span className="font-bold" style={{ color }}>
            {count}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Valeur:</span>
          <span className="font-bold text-slate-900">{value.toLocaleString()} €</span>
        </div>
      </div>
    </div>
  );
}
