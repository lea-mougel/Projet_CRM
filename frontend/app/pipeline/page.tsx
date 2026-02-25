'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { BarChart3, UserRound, LineChart, Lightbulb } from 'lucide-react';
import { contactsApi, Lead } from '../../api/contacts.api';
import CombinedPipeline from '../../components/CombinedPipeline';
import PipelineInsights from '../../components/PipelineInsights';

type CurrentUser = {
  id: string;
  role: string;
  email: string;
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
  assigned_to?: string | null;
  company?: {
    id?: string;
    name?: string | null;
    industry?: string | null;
    website?: string | null;
    address?: string | null;
    town?: string | null;
  } | null;
  phone?: string | null;
};

export default function PipelinePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showMyPipeline, setShowMyPipeline] = useState(false);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'insights'>('pipeline');

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
      const userEmail = data.session.user.email || '';
      try {
        const profile = await contactsApi.getUserProfile(userId);
        if (profile) {
          setCurrentUser({ id: userId, role: profile.role || 'user', email: userEmail });
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

  // Filtrer les leads selon le contexte
  const filteredLeads = useMemo(() => {
    if (!currentUser) return leads;
    if (currentUser.role === 'admin') {
      return showMyPipeline ? leads.filter((l) => l.assigned_to === currentUser.id) : leads;
    }
    // Pour les commerciaux, toujours afficher leur pipeline
    return leads.filter((l) => l.assigned_to === currentUser.id);
  }, [leads, currentUser, showMyPipeline]);

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
              <BarChart3 className="w-5 h-5" />
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

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Switch Ma Pipeline / Pipeline Globale (pour commerciaux) */}
        {currentUser?.role === 'commercial' && (
          <div className="mb-6 flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm">
            <span className="font-semibold text-slate-700">Vue:</span>
            <button
              onClick={() => setShowMyPipeline(true)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                showMyPipeline
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <span className="inline-flex items-center gap-2"><UserRound className="w-4 h-4" />Ma Pipeline</span>
            </button>
            <button
              onClick={() => setShowMyPipeline(false)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                !showMyPipeline
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <span className="inline-flex items-center gap-2"><BarChart3 className="w-4 h-4" />Pipeline Globale</span>
            </button>
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-4 mb-8 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'pipeline'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="inline-flex items-center gap-2"><LineChart className="w-4 h-4" />Pipeline</span>
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'insights'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {currentUser?.role === 'admin' ? (
              <span className="inline-flex items-center gap-2"><BarChart3 className="w-4 h-4" />Analyse des leads</span>
            ) : (
              <span className="inline-flex items-center gap-2"><Lightbulb className="w-4 h-4" />Insights</span>
            )}
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {activeTab === 'pipeline' && (
            <CombinedPipeline leads={filteredLeads} />
          )}
          {activeTab === 'insights' && currentUser?.role === 'commercial' && (
            <PipelineInsights leads={filteredLeads} userRole="commercial" />
          )}
          {activeTab === 'insights' && currentUser?.role === 'admin' && (
            <PipelineInsights leads={leads} userRole="admin" />
          )}
        </div>
      </div>
    </div>
  );
}
