'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { CompanyDetails, CompanyListItem, contactsApi } from '../../api/contacts.api';

type CurrentUser = {
  id: string;
  role: string;
};

export default function CompaniesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);

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

  const loadCompanies = useCallback(async () => {
    const data = await contactsApi.getCompanies(search);
    setCompanies(data);
  }, [search]);

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
    const timer = setTimeout(() => {
      void loadCompanies();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadCompanies]);

  const openCompany = async (companyId: string) => {
    const company = await contactsApi.getCompanyById(companyId, true);
    setSelectedCompany(company);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Chargement des entreprises...</div>;
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
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-black text-blue-700 italic tracking-tighter">Entreprises</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-5">
        <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une entreprise..."
          className="border p-2 rounded w-full mb-4"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => void openCompany(company.id)}
              className="text-left border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
            >
              <div className="font-semibold">{company.name}</div>
              <div className="text-sm text-gray-500">{company.town || 'Ville non renseignée'}</div>
            </button>
          ))}
        </div>
      </div>
      </div>

      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedCompany.name}</h2>
              <button
                onClick={() => setSelectedCompany(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Fermer
              </button>
            </div>

            <p><span className="font-semibold">Secteur :</span> {selectedCompany.industry || 'Non renseigné'}</p>
            <p><span className="font-semibold">Ville :</span> {selectedCompany.town || 'Non renseignée'}</p>
            <p><span className="font-semibold">Adresse :</span> {selectedCompany.address || 'Non renseignée'}</p>
            <p><span className="font-semibold">Site :</span> {selectedCompany.website || 'Non renseigné'}</p>

            <h3 className="text-lg font-bold mt-6 mb-3">Contacts associés</h3>
            <div className="space-y-2">
              {selectedCompany.contacts.map((contact) => (
                <div key={contact.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="font-semibold">{contact.first_name} {contact.last_name}</div>
                  <div className="text-sm text-gray-500">{contact.email}</div>
                  <div className="text-sm italic">Commercial: {contact.assigned_commercial?.email || 'Non assigné'}</div>
                </div>
              ))}
              {selectedCompany.contacts.length === 0 && (
                <p className="text-gray-500 italic">Aucun contact associé.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
