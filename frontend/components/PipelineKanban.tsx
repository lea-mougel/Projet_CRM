'use client';

import { Sparkles, Settings2, CheckCircle2, XCircle } from 'lucide-react';
import { Lead } from '../api/contacts.api';
import { PIPELINE_STAGES, normalizeLeadStatus } from '../lib/salesPipeline';

interface PipelineKanbanProps {
  leads: Lead[];
  loadLeads: () => Promise<void>;
}

export default function PipelineKanban({ leads, loadLeads }: PipelineKanbanProps) {
  const statuses = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    icon:
      stage.id === 'Nouveau Lead'
        ? Sparkles
        : stage.id === 'Decouverte des besoins (Audit)'
          ? Settings2
          : stage.id === 'Gagne'
            ? CheckCircle2
            : stage.id === 'Perdu'
              ? XCircle
              : Settings2,
  }));

  const totalValue = leads.reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header avec valeur totale */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Visualisation Kanban</h2>
        <div className="text-right">
          <p className="text-sm text-slate-600">Valeur totale du pipeline</p>
          <p className="text-3xl font-bold text-blue-600">{totalValue.toLocaleString()} €</p>
        </div>
      </div>

      {/* Grid Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statuses.map((status) => {
          const Icon = status.icon;
          const statusLeads = leads.filter((l) => normalizeLeadStatus(l.status) === status.id);
          const statusValue = statusLeads.reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0);

          return (
            <div key={status.id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-l-4" style={{ borderLeftColor: status.colorHex }}>
              {/* Header de colonne */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                <Icon className="w-5 h-5 text-slate-700" />
                <div>
                  <h3 className="font-bold text-slate-900">{status.label}</h3>
                  <p className="text-sm text-slate-600">{statusLeads.length} lead{statusLeads.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="mb-4 space-y-2 bg-white rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total:</span>
                  <span className="font-bold text-slate-900">{statusValue.toLocaleString()} €</span>
                </div>
                {statusLeads.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Moyenne:</span>
                    <span className="font-bold text-blue-600">
                      {(statusValue / statusLeads.length).toLocaleString()} €
                    </span>
                  </div>
                )}
              </div>

              {/* Liste des leads */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {statusLeads.length === 0 ? (
                  <p className="text-center text-slate-400 italic text-sm py-4">Aucun lead</p>
                ) : (
                  statusLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white rounded-lg p-3 border border-slate-200 hover:shadow-md transition"
                    >
                      <p className="font-semibold text-slate-900 text-sm truncate">{lead.title}</p>
                      {lead.contacts && (
                        <p className="text-xs text-slate-500 mt-1">
                          {lead.contacts.first_name} {lead.contacts.last_name}
                        </p>
                      )}
                      <p className="font-bold text-blue-600 text-sm mt-2">
                        {(lead.estimated_value || 0).toLocaleString()} €
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
