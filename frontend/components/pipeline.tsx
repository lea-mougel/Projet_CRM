'use client';
import { useState, useEffect } from 'react';
import { UserRound } from 'lucide-react';
import { contactsApi } from '../api/contacts.api';

interface Lead {
  id: string;
  title: string;
  amount: number;
  status: 'nouveau' | 'en cours' | 'converti' | 'perdu';
  source?: string;
  description?: string;
  estimated_value?: number;
  contacts?: { first_name: string, last_name: string };
}

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const dataLeads = await contactsApi.getAllLeads();
        const normalizedLeads: Lead[] = dataLeads.map((lead) => ({
          id: lead.id,
          title: lead.title,
          amount: Number(lead.estimated_value) || 0,
          status: lead.status,
          source: lead.source || undefined,
          description: lead.description || undefined,
          estimated_value: lead.estimated_value,
          contacts: lead.contacts
            ? {
                first_name: lead.contacts.first_name,
                last_name: lead.contacts.last_name,
              }
            : undefined,
        }));
        setLeads(normalizedLeads);
      } catch (err) {
        console.error('Error loading leads:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadLeads();
  }, []);

  const statuses = [
    { id: 'nouveau', label: 'Nouveau', color: 'bg-blue-500' },
    { id: 'en cours', label: 'En Cours', color: 'bg-yellow-500' },
    { id: 'converti', label: 'Converti', color: 'bg-green-500' },
    { id: 'perdu', label: 'Perdu', color: 'bg-red-500' }
  ];

  const totalAmount = leads.reduce((acc, lead) => acc + (Number(lead.amount) || 0), 0);

  if (loading) return <p className="text-slate-400 animate-pulse font-bold">Chargement de la pipeline...</p>;

  return (
    <>
      <section className="mt-12">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wide">Pipeline de Vente</h2>
            <p className="text-slate-500 font-bold">Valeur totale : {totalAmount.toLocaleString()} €</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase shadow-lg hover:bg-blue-700">
            + Nouveau Lead
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statuses.map(status => (
            <div key={status.id} className="bg-slate-200/50 p-4 rounded-2xl border-2 border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                <h3 className="font-black text-slate-700 uppercase text-sm">{status.label}</h3>
                <span className="ml-auto bg-slate-300 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                  {leads.filter(l => l.status === status.id).length}
                </span>
              </div>

              <div className="space-y-3">
                {leads.filter(l => l.status === status.id).map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="w-full text-left bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                  >
                    <p className="font-bold text-slate-900 leading-tight mb-1">{lead.title}</p>
                    <p className="text-xs text-slate-500 mb-2">{lead.contacts?.first_name} {lead.contacts?.last_name}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-black text-sm">{lead.amount} €</span>
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]"><UserRound className="w-3.5 h-3.5 text-slate-600" /></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedLead.title}</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-semibold text-slate-700">Valeur:</span>
                <p className="text-blue-700 font-bold text-lg">{(selectedLead.amount || selectedLead.estimated_value || 0).toLocaleString()} €</p>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Statut:</span>
                <span className={`inline-block ml-2 px-3 py-1 rounded-lg text-white font-bold text-sm ${
                  selectedLead.status === 'nouveau' ? 'bg-blue-500' :
                  selectedLead.status === 'en cours' ? 'bg-yellow-500' :
                  selectedLead.status === 'converti' ? 'bg-green-500' :
                  'bg-red-500'
                }`}>
                  {selectedLead.status}
                </span>
              </div>

              {selectedLead.source && (
                <div>
                  <span className="font-semibold text-slate-700">Source:</span>
                  <p>{selectedLead.source}</p>
                </div>
              )}

              {selectedLead.contacts && (
                <div>
                  <span className="font-semibold text-slate-700">Contact:</span>
                  <p>{selectedLead.contacts.first_name} {selectedLead.contacts.last_name}</p>
                </div>
              )}

              {selectedLead.description && (
                <div>
                  <span className="font-semibold text-slate-700">Description:</span>
                  <p className="mt-1 text-slate-600">{selectedLead.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}