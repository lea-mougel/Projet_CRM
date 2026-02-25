'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { CompanyDetails, CompanyListItem, contactsApi, CompanyPayload } from '../../api/contacts.api';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<CompanyPayload>({ name: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CompanyPayload>({ name: '' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [unassignedContacts, setUnassignedContacts] = useState<any[]>([]);
  const [searchContact, setSearchContact] = useState('');
  const [showCreateNewContact, setShowCreateNewContact] = useState(false);
  const [newContactForm, setNewContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

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
    if (company) {
      setEditForm({
        name: company.name,
        industry: company.industry || '',
        website: company.website || '',
        address: company.address || '',
        town: company.town || '',
      });
    }
  };

  const handleSaveCompany = async () => {
    if (selectedCompany && editForm.name) {
      await contactsApi.updateCompany(selectedCompany.id, editForm);
      setIsEditing(false);
      await openCompany(selectedCompany.id);
      await loadCompanies();
    }
  };

  const handleDeleteCompany = async () => {
    if (selectedCompany && window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedCompany.name}?`)) {
      await contactsApi.deleteCompany(selectedCompany.id);
      setSelectedCompany(null);
      await loadCompanies();
    }
  };

  const handleCreateCompany = async () => {
    if (createForm.name) {
      await contactsApi.createCompany(createForm);
      setCreateForm({ name: '' });
      setShowCreateForm(false);
      await loadCompanies();
    }
  };

  const handleCreateContact = async () => {
    if (!selectedCompany || !newContactForm.first_name || !newContactForm.last_name || !newContactForm.email) {
      alert('Veuillez remplir prénom, nom et email');
      return;
    }
    try {
      await contactsApi.create({
        first_name: newContactForm.first_name,
        last_name: newContactForm.last_name,
        email: newContactForm.email,
        phone: newContactForm.phone,
        company_id: selectedCompany.id,
      });
      setNewContactForm({ first_name: '', last_name: '', email: '', phone: '' });
      setShowCreateNewContact(false);
      await openCompany(selectedCompany.id);
    } catch (error) {
      console.error('Erreur lors de la création du contact:', error);
      alert('Erreur lors de la création du contact');
    }
  };

  const handleSelectContact = async (contactId: string) => {
    if (!selectedCompany) return;
    try {
      await contactsApi.update(contactId, { company_id: selectedCompany.id });
      setShowAddContact(false);
      setSearchContact('');
      await openCompany(selectedCompany.id);
    } catch (error) {
      console.error('Erreur lors de l\'association du contact:', error);
      alert('Erreur lors de l\'association du contact');
    }
  };

  const handleOpenAddContact = async () => {
    setShowAddContact(true);
    try {
      const contacts = await contactsApi.getUnassignedContacts();
      setUnassignedContacts(contacts);
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
    }
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
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une entreprise..."
              className="flex-1 border border-slate-300 p-2 rounded"
            />
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
            >
              + Nouvelle Entreprise
            </button>
          </div>
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

      {/* Modale Création */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Nouvelle Entreprise</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded"
              />
              <input
                type="text"
                placeholder="Secteur d'activité"
                value={createForm.industry || ''}
                onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded"
              />
              <input
                type="text"
                placeholder="Site web"
                value={createForm.website || ''}
                onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded"
              />
              <input
                type="text"
                placeholder="Adresse"
                value={createForm.address || ''}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded"
              />
              <input
                type="text"
                placeholder="Ville"
                value={createForm.town || ''}
                onChange={(e) => setCreateForm({ ...createForm, town: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateCompany}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
              >
                Créer
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-black rounded font-bold hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Détails / Édition */}
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

            {isEditing ? (
              <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded">
                <input
                  type="text"
                  placeholder="Nom"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Secteur"
                  value={editForm.industry || ''}
                  onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Site web"
                  value={editForm.website || ''}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Adresse"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Ville"
                  value={editForm.town || ''}
                  onChange={(e) => setEditForm({ ...editForm, town: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCompany}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2 bg-gray-400 text-white rounded font-bold hover:bg-gray-500"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p><span className="font-semibold">Secteur :</span> {selectedCompany.industry || 'Non renseigné'}</p>
                <p><span className="font-semibold">Ville :</span> {selectedCompany.town || 'Non renseignée'}</p>
                <p><span className="font-semibold">Adresse :</span> {selectedCompany.address || 'Non renseignée'}</p>
                <p><span className="font-semibold">Site :</span> {selectedCompany.website || 'Non renseigné'}</p>

                <div className="flex gap-2 mt-4 mb-6">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={handleDeleteCompany}
                    className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </>
            )}

            <h3 className="text-lg font-bold mt-6 mb-3">Contacts associés ({selectedCompany.contacts.length})</h3>
            <div className="space-y-2 mb-6">
              {selectedCompany.contacts.map((contact) => (
                <div key={contact.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="font-semibold">{contact.first_name} {contact.last_name}</div>
                  <div className="text-sm text-gray-500">{contact.email}</div>
                  <div className="text-sm italic">Commercial (contact principal): {contact.assigned_commercial?.email || 'Non assigné'}</div>
                </div>
              ))}
              {selectedCompany.contacts.length === 0 && !showAddContact && (
                <p className="text-gray-500 italic">Aucun contact associé.</p>
              )}
              {!showAddContact && (
                <button
                  onClick={() => void handleOpenAddContact()}
                  className="w-full px-4 py-2 border-2 border-dashed border-blue-400 text-blue-600 rounded font-semibold hover:bg-blue-50 transition"
                >
                  + Ajouter un contact
                </button>
              )}
            </div>

            {showAddContact && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Ajouter un contact</h3>
                    <button
                      onClick={() => {
                        setShowAddContact(false);
                        setSearchContact('');
                        setShowCreateNewContact(false);
                      }}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {showCreateNewContact ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Prénom"
                        value={newContactForm.first_name}
                        onChange={(e) => setNewContactForm({ ...newContactForm, first_name: e.target.value })}
                        className="w-full border border-slate-300 p-2 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Nom"
                        value={newContactForm.last_name}
                        onChange={(e) => setNewContactForm({ ...newContactForm, last_name: e.target.value })}
                        className="w-full border border-slate-300 p-2 rounded"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newContactForm.email}
                        onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                        className="w-full border border-slate-300 p-2 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Téléphone (optionnel)"
                        value={newContactForm.phone}
                        onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })}
                        className="w-full border border-slate-300 p-2 rounded"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => void handleCreateContact()}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                        >
                          Créer
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateNewContact(false);
                            setNewContactForm({ first_name: '', last_name: '', email: '', phone: '' });
                          }}
                          className="flex-1 px-4 py-2 bg-gray-400 text-white rounded font-bold hover:bg-gray-500"
                        >
                          Retour
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Chercher un contact..."
                          value={searchContact}
                          onChange={(e) => setSearchContact(e.target.value)}
                          className="flex-1 border border-slate-300 p-2 rounded"
                        />
                        <button
                          onClick={() => setShowCreateNewContact(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                        >
                          +
                        </button>
                      </div>

                      <div className="max-h-96 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded border border-slate-200">
                        {unassignedContacts
                          .filter((contact) => {
                            const search = searchContact.toLowerCase();
                            return (
                              contact.first_name.toLowerCase().includes(search) ||
                              contact.last_name.toLowerCase().includes(search) ||
                              contact.email.toLowerCase().includes(search)
                            );
                          })
                          .map((contact) => (
                            <button
                              key={contact.id}
                              onClick={() => void handleSelectContact(contact.id)}
                              className="w-full text-left border border-slate-300 rounded-lg p-3 hover:bg-blue-50 transition"
                            >
                              <div className="font-semibold">{contact.first_name} {contact.last_name}</div>
                              <div className="text-sm text-gray-500">{contact.email}</div>
                              {contact.phone && <div className="text-sm text-gray-400">{contact.phone}</div>}
                            </button>
                          ))}
                        {unassignedContacts.filter((contact) => {
                          const search = searchContact.toLowerCase();
                          return (
                            contact.first_name.toLowerCase().includes(search) ||
                            contact.last_name.toLowerCase().includes(search) ||
                            contact.email.toLowerCase().includes(search)
                          );
                        }).length === 0 && (
                          <p className="text-center text-gray-500 italic py-4">Aucun contact trouvé</p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setShowAddContact(false);
                          setSearchContact('');
                        }}
                        className="w-full px-4 py-2 bg-gray-400 text-white rounded font-bold hover:bg-gray-500"
                      >
                        Fermer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedCompany.leads && selectedCompany.leads.length > 0 && (
              <>
                <h3 className="text-lg font-bold mt-6 mb-3">Leads associés ({selectedCompany.leads.length})</h3>
                <div className="space-y-2">
                  {selectedCompany.leads.map((lead) => (
                    <div key={lead.id} className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                      <div className="font-semibold">{lead.title}</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Statut: <strong>{lead.status}</strong></span>
                        <span className="text-green-700 font-bold">{lead.estimated_value.toLocaleString()} €</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
