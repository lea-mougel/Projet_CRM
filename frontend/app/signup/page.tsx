'use client';
import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  // Initialisation du client Supabase avec les variables d'environnement
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Tentative d'inscription via Supabase Auth [cite: 79]
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Inscription réussie ! Vérifiez vos emails pour confirmer votre compte.");
      router.push('/login'); // Redirection vers la page de connexion [cite: 75]
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-xl">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Créer un compte</h1>
        <p className="mb-6 text-sm text-slate-500">Rejoignez votre CRM SaaS moderne.</p>
        
        <form onSubmit={handleSignup} className="space-y-4">
  <div>
    <label className="block text-sm font-semibold text-slate-800">Email professionnel</label>
    <input 
      type="email" 
      placeholder="nom@exemple.com" 
      className="w-full p-3 mt-1 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none" 
      onChange={(e) => setEmail(e.target.value)} 
      required
    />
  </div>
  <div>
    <label className="block text-sm font-semibold text-slate-800">Mot de passe</label>
    <input 
      type="password" 
      placeholder="••••••••" 
      className="w-full p-3 mt-1 border border-slate-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500 outline-none" 
      onChange={(e) => setPassword(e.target.value)} 
      required
    />
  </div>
  <button 
    type="submit"
    className="w-full p-3 text-white bg-blue-600 rounded-lg font-bold hover:bg-blue-700 transition"
  >
    S'inscrire
  </button>
</form>
        
        <p className="mt-6 text-center text-sm text-slate-600">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}