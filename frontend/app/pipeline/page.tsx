'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { contactsApi, Lead } from '../../api/contacts.api';
import PipelineKanban from '../../components/PipelineKanban';
import PipelineFunnel from '../../components/PipelineFunnel';
import PipelineInsights from '../../components/PipelineInsights';

type CurrentUser = {
  id: string;
  role: string;
};

type Company = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_id?: string | null;
};

export default function PipelinePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<'kanban' | 'funnel' | 'insights'>('kanban');

  const supabase = useMemo(
    () =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }),
    [],
  );

  const loadLeads = useCallback(async () => {
    try {
      const data = await contactsApi.getAllLeads();
      setLeads(data);
    } catch (error) {
      console.error('Erreur chargement leads:', error);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const data = await contactsApi.getCompanies('');
      setCompanies(data);
    } catch (error) {
      console.error('Erreur chargement entreprises:', error);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const data = await contactsApi.getAll('', true);
      setContacts(data);
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        router.push('/login');
        return;
      }

      const userId = data.session.user.id;
      try {
        const profile = await contactsApi.getUserProfile(userId);
        if (profile) {
          setCurrentUser({ id: userId, role: profile.role || 'user' });
        }
      } catch (err) {
        console.error('Erreur profil:', err);
      }

      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  useEffect(() => {
    if (!loading) {
      loadLeads();
      loadCompanies();
      loadContacts();
    }
  }, [loading, loadLeads, loadCompanies, loadContacts]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              📊
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Pipeline de Vente</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Onglets */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'kanban'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Kanban
          </button>
          <button
            onClick={() => setActiveTab('funnel')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'funnel'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            📈 Funnel
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              activeTab === 'insights'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            💡 Insights
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {activeTab === 'kanban' && (
            <PipelineKanban leads={leads} loadLeads={loadLeads} />
          )}
          {activeTab === 'funnel' && (
            <PipelineFunnel leads={leads} />
          )}
          {activeTab === 'insights' && (
            <PipelineInsights leads={leads} />
          )}
        </div>
      </div>
    </div>
  );
}
