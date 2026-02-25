'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import ContactList from '../../components/ContactList';

type CurrentUser = {
  id: string;
  role: string;
};

export default function ContactsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');

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
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'all') {
      setActiveTab('all');
      return;
    }
    setActiveTab('my');
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Chargement des contacts...</div>;
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
        <div className="max-w-7xl mx-auto space-y-4">
          <h1 className="text-2xl font-black text-blue-700 italic tracking-tighter">Contacts</h1>
          <div className="flex gap-3 border-b border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 text-sm font-black uppercase transition border-b-2 whitespace-nowrap ${
                activeTab === 'my'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Mes contacts
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-black uppercase transition border-b-2 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Contacts
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto">
        <ContactList currentUser={currentUser} mode={activeTab} />
      </div>
    </div>
  );
}
