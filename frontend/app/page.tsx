'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lockDuration: 0, 
    }
  }
);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) router.push('/login');
    });
  }, [router, supabase.auth]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <p className="text-slate-500 font-bold animate-pulse">Chargement de la session...</p>
    </div>
  );

  return session ? <Dashboard session={session} /> : null;
}