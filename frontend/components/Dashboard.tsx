'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function Dashboard({ session }: { session: any }) {
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true, storageKey: 'crm-auth-token', lockDuration: 0 } }
  ), []);

  const [role, setRole] = useState<string>('chargement');
  const [contacts, setContacts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Récupérer le rôle (Sécurisé par RLS)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) console.error("Erreur Supabase :", error.message);

      if (profile) {
        setRole(profile.role);
        
        // 2. Charger les données si Admin ou Commercial
        if (profile.role === 'admin' || profile.role === 'commercial') {
          const [resC, resL] = await Promise.all([
            fetch('http://localhost:3000/contacts'),
            fetch('http://localhost:3000/leads')
          ]);
          if (resC.ok) setContacts(await resC.json());
          if (resL.ok) setLeads(await resL.json());
          
          // 3. Charger la liste des membres pour l'assignation/gestion
          const { data: pro } = await supabase.from('profiles').select('*').order('email');
          if (pro) setAllProfiles(pro);
        }
      } else {
        setRole('user');
      }
    } catch (err) {
      console.error("Erreur système :", err);
    } finally {
      setLoading(false);
    }
  }, [session.user.id, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/login';
  };

  const assignContact = async (contactId: string, commercialId: string) => {
    const { error } = await supabase
      .from('contacts')
      .update({ assigned_to: commercialId === "none" ? null : commercialId })
      .eq('id', contactId);

    if (!error) {
      setAdminMessage("✅ Contact réassigné !");
      loadData();
    } else {
      setAdminMessage("❌ Erreur : Permission refusée.");
    }
  };

  const rotateRole = async (userId: string, currentRole: string) => {
    let nextRole = 'user';
    if (currentRole === 'user') nextRole = 'commercial';
    else if (currentRole === 'commercial') nextRole = 'admin';
    else if (currentRole === 'admin') nextRole = 'user';

    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', userId);
    if (!error) {
      setAdminMessage(`Grade modifié : ${nextRole.toUpperCase()}`);
      loadData();
    } else {
      setAdminMessage("❌ Erreur : Seul un Admin peut faire ça.");
    }
  };

  const totalValue = leads.reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0);
  const commercialsOnly = allProfiles.filter(p => p.role === 'commercial' || p.role === 'admin');

  if (loading) return <div className="p-20 text-center font-black text-blue-600 animate-pulse">VÉRIFICATION DES ACCÈS...</div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12 font-sans">
      <nav className="bg-white border-b-2 border-slate-200 p-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowRoleManager(false)}>
          <h1 className="text-2xl font-black text-blue-700 italic tracking-tighter">CRM PRO</h1>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
            role === 'admin' ? 'bg-purple-600 text-white' : role === 'commercial' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
          }`}>
            {role}
          </span>
        </div>
        <button onClick={handleLogout} className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-red-600 transition">DÉCONNEXION</button>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {showRoleManager && role === 'admin' ? (
          <section className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-purple-200 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-purple-900 uppercase italic mb-8">Administration des Rôles</h2>
            <div className="grid gap-4">
              {allProfiles.map(u => (
                <div key={u.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div><p className="font-black text-sm">{u.email}</p></div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase px-3 py-1 bg-white border rounded-full">{u.role}</span>
                    <button onClick={() => rotateRole(u.id, u.role)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-purple-600 transition">Changer Grade</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <>
            {role === 'user' ? (
              <div className="bg-white p-20 rounded-[3rem] text-center border shadow-xl max-w-2xl mx-auto mt-10">
                <div className="text-6xl mb-6">🔒</div>
                <h2 className="text-3xl font-black mb-4 uppercase italic">Accès restreint</h2>
                <p className="text-slate-500 font-bold italic">Votre compte est en attente de validation. Contactez un Admin.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                {role === 'admin' && (
                  <section className="p-8 bg-gradient-to-br from-purple-900 to-indigo-800 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                    <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter">Console Admin</h2>
                    {adminMessage && <div className="mb-4 p-2 bg-white/20 rounded-lg text-xs font-bold border border-white/30 italic">📢 {adminMessage}</div>}
                    <button onClick={() => setShowRoleManager(true)} className="bg-white text-purple-900 px-7 py-3 rounded-2xl text-xs font-black uppercase shadow-2xl hover:scale-105 transition">⚙️ Gérer les membres</button>
                  </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <section className="lg:col-span-5 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 h-fit">
                    <h2 className="text-xl font-black mb-8 text-slate-800 uppercase italic">Répertoire ({contacts.length})</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {contacts.map(c => (
                        <div key={c.id} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-blue-400 transition-all">
                          <div className="mb-4">
                            <p className="font-black text-slate-900">{c.first_name} {c.last_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.email}</p>
                          </div>
                          <div className="pt-4 border-t border-slate-200">
                            <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 italic">Commercial Assigné :</label>
                            {role === 'admin' ? (
                              <select 
                                value={c.assigned_to || "none"}
                                onChange={(e) => assignContact(c.id, e.target.value)}
                                className="w-full bg-white border-2 border-slate-200 p-2.5 rounded-xl text-[10px] font-black focus:border-blue-500 outline-none cursor-pointer"
                              >
                                <option value="none">-- Aucun --</option>
                                {commercialsOnly.map(com => (
                                  <option key={com.id} value={com.id}>{com.email}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-blue-700 text-[10px] font-black uppercase tracking-tighter">
                                {c.assigned_commercial?.email || 'NON ASSIGNÉ'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="lg:col-span-7 space-y-6">
                    <h2 className="text-2xl font-black text-slate-800 uppercase italic">Pipeline ({totalValue.toLocaleString()} €)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {['nouveau', 'en cours', 'converti', 'perdu'].map(st => (
                        <div key={st} className="bg-slate-200/40 p-3 rounded-[1.5rem] border border-slate-200/50">
                          <h3 className="font-black text-slate-400 uppercase text-[8px] mb-4 text-center tracking-widest">{st}</h3>
                          <div className="space-y-3">
                            {leads.filter(l => l.status === st).map(le => (
                              <div key={le.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <p className="text-[12px] font-black text-slate-900">{Number(le.estimated_value).toLocaleString()} €</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}