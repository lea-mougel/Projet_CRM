'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ContactList from '../../components/ContactList';
import TopNavigation from '../../components/TopNavigation';

type CurrentUser = {
  id: string;
  role: string;
};

export default function ContactsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b-2 border-slate-200 p-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-black text-blue-700 italic tracking-tighter">Tous les Contacts</h1>
        </div>
      </header>
      <div className="max-w-7xl mx-auto">
        <ContactList currentUser={currentUser} mode="all" />
      </div>
    </div>
  );
}
