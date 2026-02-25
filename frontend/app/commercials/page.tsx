'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { contactsApi, Lead } from '../../api/contacts.api';
import CommercialsList from '../../components/CommercialsList';

type CurrentUser = {
  id: string;
  role: string;
};

export default function CommercialsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [commercials, setCommercials] = useState<Array<{ id: string; email: string }>>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

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

  // Charger les commerciaux depuis la base de données
  const loadCommercials = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('role', 'commercial');

      if (!error && data) {
        setCommercials(data as Array<{ id: string; email: string }>);
      }
    } catch (error) {
      console.error('Erreur chargement commerciaux:', error);
    }
  }, [supabase]);

  const loadLeads = useCallback(async () => {
    try {
      const data = await contactsApi.getAllLeads();
      setLeads(data);
    } catch (error) {
      console.error('Erreur chargement leads:', error);
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
          // Vérifier que c'est un admin
          if (profile.role !== 'admin') {
            router.push('/');
          }
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
      loadCommercials();
      loadLeads();
    }
  }, [loading, loadCommercials, loadLeads]);

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
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
              🎯
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Commerciaux</h1>
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
        <CommercialsList commercials={commercials} leads={leads} />
      </div>
    </div>
  );
}
