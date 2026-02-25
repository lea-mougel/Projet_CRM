'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type CurrentUser = {
  id: string;
  role: string;
};

type Lead = {
  id: string;
  title: string;
  amount: number;
  status: 'nouveau' | 'en_cours' | 'gagné' | 'perdu';
  source?: string;
  contact_id?: string;
  description?: string;
  estimated_value?: number;
  contacts?: {
    first_name?: string;
    last_name?: string;
  };
};

export default function LeadsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const supabase = useMemo(
    () =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }),
    [],
  );

  const loadLeads = useCallback(async () => {
    const headers: Record<string, string> = {};
    if (currentUser?.id) {
      headers['X-User-Id'] = currentUser.id;
    }
    const response = await fetch('http://localhost:3000/leads', { headers });
    if (response.ok) {
      const data = await response.json();
      setLeads(data);
    }
  }, [currentUser]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      const role = profile?.role || 'user';
      setCurrentUser({ id: session.user.id, role });
      setLoading(false);
    };

    void init();
  }, [router, supabase]);

  useEffect(() => {
    if (!loading) {
      void loadLeads();
    }
  }, [loading, loadLeads]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/login';
  };

  const statuses = [
    { id: 'nouveau', label: 'Nouveau', color: 'bg-blue-500' },
    { id: 'en_cours', label: 'En Cours', color: 'bg-yellow-500' },
    { id: 'gagné', label: 'Gagné', color: 'bg-green-500' },
    { id: 'perdu', label: 'Perdu', color: 'bg-red-500' }
  ];

  const filteredLeads = filterStatus ? leads.filter(l => l.status === filterStatus) : leads;
  const totalValue = leads.reduce((acc, curr) => acc + (Number(curr.amount || curr.estimated_value) || 0), 0);

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Chargement des leads...</div>;
  }

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'commercial')) {
    return (
      <div className="p-10 text-center text-slate-500">
        Accès refusé. Cette page est réservée aux admins et commerciaux.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b-2 border-slate-200 p-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-black text-blue-700 italic tracking-tighter">Leads</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Pipeline de Vente</h2>
              <p className="text-slate-500 font-semibold">Valeur totale: {totalValue.toLocaleString()} €</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {statuses.map(status => (
              <button
                key={status.id}
                onClick={() => setFilterStatus(filterStatus === status.id ? null : status.id)}
                className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                  filterStatus === status.id
                    ? 'bg-slate-100 border-slate-400'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                  <h3 className="font-bold text-slate-700 text-sm">{status.label}</h3>
                  <span className="ml-auto bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                    {leads.filter(l => l.status === status.id).length}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredLeads.map(lead => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="w-full text-left p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{lead.title}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {lead.contacts?.first_name} {lead.contacts?.last_name}
                    </p>
                    {lead.source && <p className="text-xs text-slate-400 mt-1">Source: {lead.source}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700">{(lead.amount || lead.estimated_value || 0).toLocaleString()} €</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold text-white ${
                      lead.status === 'nouveau' ? 'bg-blue-500' :
                      lead.status === 'en_cours' ? 'bg-yellow-500' :
                      lead.status === 'gagné' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {filteredLeads.length === 0 && (
              <div className="p-6 text-center text-slate-400 italic">
                Aucun lead trouvé.
              </div>
            )}
          </div>
        </div>
      </div>

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
                  selectedLead.status === 'en_cours' ? 'bg-yellow-500' :
                  selectedLead.status === 'gagné' ? 'bg-green-500' :
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
    </div>
  );
}
