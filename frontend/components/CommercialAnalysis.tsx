'use client';

import { useState, useMemo } from 'react';
import { ClipboardList, UserRound, Users, LineChart, Lightbulb, Sparkles, Settings2, CheckCircle2, XCircle } from 'lucide-react';
import { Lead, Contact } from '../api/contacts.api';
import CombinedPipeline from './CombinedPipeline';
import PipelineInsights from './PipelineInsights';

interface CommercialAnalysisProps {
  leads: Lead[];
  contacts: Contact[];
  commercials: Array<{ id: string; email: string }>;
  preSelectedCommercialId?: string;
}

export default function CommercialAnalysis({
  leads,
  contacts,
  commercials,
  preSelectedCommercialId,
}: CommercialAnalysisProps) {
  const isCommercialLocked = Boolean(preSelectedCommercialId);
  const [selectedCommercialId, setSelectedCommercialId] = useState<string>(
    preSelectedCommercialId || commercials[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'contacts' | 'pipeline' | 'insights' | 'leads'>('contacts');

  const selectedCommercial = commercials.find((c) => c.id === selectedCommercialId);
  const commercialLeads = useMemo(
    () => leads.filter((l) => l.assigned_to === selectedCommercialId),
    [leads, selectedCommercialId]
  );
  const commercialContacts = useMemo(
    () => contacts.filter((c) => c.assigned_to === selectedCommercialId),
    [contacts, selectedCommercialId]
  );

  const totalValue = commercialLeads.reduce(
    (acc, l) => acc + (Number(l.estimated_value) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Sélection du commercial */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        {!isCommercialLocked && (
          <>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <span className="inline-flex items-center gap-2"><ClipboardList className="w-4 h-4" />Sélectionner un commercial</span>
            </label>
            <select
              value={selectedCommercialId}
              onChange={(e) => setSelectedCommercialId(e.target.value)}
              className="w-full md:w-80 border-2 border-slate-300 rounded-lg p-3 font-semibold text-slate-900 focus:border-blue-500 outline-none"
            >
              {commercials.map((commercial) => (
                <option key={commercial.id} value={commercial.id}>
                  {commercial.email}
                </option>
              ))}
            </select>
          </>
        )}

        {isCommercialLocked && selectedCommercial && (
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-700 inline-flex items-center gap-2"><UserRound className="w-4 h-4" />Commercial sélectionné</p>
            <p className="text-slate-900 font-semibold">{selectedCommercial.email}</p>
          </div>
        )}

        {selectedCommercial && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Contacts</p>
              <p className="text-2xl font-bold text-slate-900">{commercialContacts.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Leads</p>
              <p className="text-2xl font-bold text-slate-900">{commercialLeads.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-1">Valeur pipeline</p>
              <p className="text-2xl font-bold text-blue-600">{totalValue.toLocaleString()} €</p>
            </div>
          </div>
        )}
      </div>

      {/* Onglets d'analyse */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'contacts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="inline-flex items-center gap-2"><Users className="w-4 h-4" />Contacts ({commercialContacts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'pipeline'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="inline-flex items-center gap-2"><LineChart className="w-4 h-4" />Pipeline</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'insights'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="inline-flex items-center gap-2"><Lightbulb className="w-4 h-4" />Insights</span>
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 ${
            activeTab === 'leads'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="inline-flex items-center gap-2"><ClipboardList className="w-4 h-4" />Détails des leads ({commercialLeads.length})</span>
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="bg-white rounded-xl p-6">
        {activeTab === 'contacts' && (
          <ContactsTab contacts={commercialContacts} />
        )}
        {activeTab === 'pipeline' && (
          <CombinedPipeline leads={commercialLeads} />
        )}
        {activeTab === 'insights' && (
          <PipelineInsights leads={commercialLeads} userRole="commercial" />
        )}
        {activeTab === 'leads' && (
          <LeadsDetailsTab leads={commercialLeads} />
        )}
      </div>
    </div>
  );
}

// Sous-composants

function ContactsTab({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return <p className="text-center text-slate-400 italic py-8">Aucun contact assigné</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left py-3 px-4 font-semibold text-slate-700">Nom</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-700">Téléphone</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-700">Entreprise</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4 font-semibold text-slate-900">
                {contact.first_name} {contact.last_name}
              </td>
              <td className="py-3 px-4 text-blue-600">{contact.email}</td>
              <td className="py-3 px-4 text-slate-600">{contact.phone || '-'}</td>
              <td className="py-3 px-4 text-slate-600">{contact.company?.name || 'Indépendant'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadsDetailsTab({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return <p className="text-center text-slate-400 italic py-8">Aucun lead assigné</p>;
  }

  const statuses = [
    { id: 'nouveau', label: 'Nouveau', icon: Sparkles, color: '#3b82f6' },
    { id: 'en cours', label: 'En Cours', icon: Settings2, color: '#eab308' },
    { id: 'converti', label: 'Converti', icon: CheckCircle2, color: '#22c55e' },
    { id: 'perdu', label: 'Perdu', icon: XCircle, color: '#ef4444' },
  ];

  const getStatusInfo = (status: string) => {
    return statuses.find((s) => s.id === status) || statuses[0];
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Statut</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Titre</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Entreprise</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Source</th>
              <th className="text-center py-3 px-4 font-semibold text-slate-700">Valeur estimée</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const statusInfo = getStatusInfo(lead.status);
              const StatusIcon = statusInfo.icon;
              return (
                <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" style={{ color: statusInfo.color }} />
                      <span className="font-semibold text-slate-900">{statusInfo.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{lead.title || 'Sans titre'}</td>
                  <td className="py-3 px-4 text-slate-600">{lead.companies?.name || '-'}</td>
                  <td className="py-3 px-4 text-slate-600">{lead.source || '-'}</td>
                  <td className="py-3 px-4 text-center font-semibold text-blue-600">
                    {Number(lead.estimated_value || 0).toLocaleString()} €
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
