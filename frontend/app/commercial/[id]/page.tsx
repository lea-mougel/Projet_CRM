'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter, useParams } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { contactsApi, Lead, Contact } from '../../../api/contacts.api';
import CommercialAnalysis from '../../../components/CommercialAnalysis';

type CurrentUser = {
  id: string;
  role: string;
  email: string;
};

export default function CommercialDetailPage() {
  const router = useRouter();
  const params = useParams();
  const commercialId = params.id as string;

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [commercial, setCommercial] = useState<{ id: string; email: string } | null>(null);

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

  const loadContacts = useCallback(async () => {
    try {
      const data = await contactsApi.getAll('', true);
      setContacts(data);
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    }
  }, []);

  const loadCommercial = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', commercialId)
        .single();

      if (!error && data) {
        setCommercial(data as { id: string; email: string });
      }
    } catch (error) {
      console.error('Erreur chargement commercial:', error);
    }
  }, [supabase, commercialId]);

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
      loadContacts();
      loadCommercial();
    }
  }, [loading, loadLeads, loadContacts, loadCommercial]);

  const handleGoBack = () => {
    router.push('/pipeline');
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Chargement...</div>;
  }

  if (!commercial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-10">
        <div className="text-center">
          <p className="text-slate-600 font-semibold mb-4">Commercial non trouvé</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const commercialEmail = commercial.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              ← Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                <UserRound className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {commercialEmail.split('@')[0].toLowerCase()}
                </h1>
                <p className="text-sm text-slate-600">{commercialEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <CommercialAnalysis
            leads={leads}
            contacts={contacts}
            commercials={[commercial]}
            preSelectedCommercialId={commercialId}
          />
        </div>
      </div>
    </div>
  );
}
