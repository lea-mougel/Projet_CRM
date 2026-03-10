'use client';
import { createClient } from '@supabase/supabase-js';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
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
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setErrorMsg("Erreur : " + error.message);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl border border-slate-300">
        <h1 className="mb-6 text-3xl font-black text-black text-center uppercase tracking-tight">Connexion CRM</h1>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg font-bold text-sm border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Email</label>
            <input 
              type="email" 
              className="w-full p-4 border-2 border-slate-300 rounded-xl bg-white text-black text-lg focus:border-blue-600 outline-none" 
              placeholder="votre@email.com"
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Mot de passe</label>
            <input 
              type="password" 
              className="w-full p-4 border-2 border-slate-300 rounded-xl bg-white text-black text-lg focus:border-blue-600 outline-none" 
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>
          <button type="submit" className="w-full p-4 text-white bg-blue-700 rounded-xl font-black text-xl hover:bg-blue-800 shadow-lg transition-transform active:scale-95">
            SE CONNECTER
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600 font-medium">
          Pas encore de compte ? <Link href="/signup" className="text-blue-700 font-bold hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
}