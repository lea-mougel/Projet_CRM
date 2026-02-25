'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { contactsApi, Lead } from '../../api/contacts.api';

type CurrentUser = {
  id: string;
  role: string;
};

type Company = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_id?: string | null;
};

export default function LeadsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [editForm, setEditForm] = useState<any>({});
  const [createForm, setCreateForm] = useState({
    title: '',
    estimated_value: '',
    status: 'nouveau',
    company_id: '',
    contact_id: '',
    source: '',
    description: '',
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

  const loadLeads = useCallback(async () => {
    try {
      const data = await contactsApi.getAllLeads();
      setLeads(data);
    } catch (error) {
      console.error('Erreur chargement leads:', error);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const data = await contactsApi.getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Erreur chargement entreprises:', error);
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

  const handleCreateLead = async () => {
    if (!createForm.title) {
      alert('Veuillez remplir le titre du lead');
      return;
    }
    try {
      await contactsApi.createLead({
        title: createForm.title,
        estimated_value: createForm.estimated_value ? Number(createForm.estimated_value) : undefined,
        status: createForm.status as any,
        company_id: createForm.company_id || undefined,
        contact_id: createForm.contact_id || undefined,
        source: createForm.source || undefined,
        description: createForm.description || undefined,
      });
      setCreateForm({
        title: '',
        estimated_value: '',
        status: 'nouveau',
        company_id: '',
        contact_id: '',
        source: '',
        description: '',
      });
      setShowCreateForm(false);
      await loadLeads();
    } catch (error) {
      console.error('Erreur création lead:', error);
      alert('Erreur lors de la création du lead');
    }
  };

  const handleSaveLead = async () => {
    if (!selectedLead) return;
    try {
      await contactsApi.updateLead(selectedLead.id, editForm);
      const updated = await contactsApi.getLeadById(selectedLead.id);
      setSelectedLead(updated);
      setIsEditingLead(false);
      setEditForm({});
      await loadLeads();
    } catch (error) {
      console.error('Erreur mise à jour lead:', error);
      alert('Erreur lors de la mise à jour du lead');
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    const confirmed = window.confirm('Supprimer ce lead ?');
    if (!confirmed) return;
    try {
      await contactsApi.deleteLead(selectedLead.id);
      setSelectedLead(null);
      await loadLeads();
    } catch (error) {
      console.error('Erreur suppression lead:', error);
      alert('Erreur lors de la suppression du lead');
    }
  };

  const handleOpenLead = async (leadId: string) => {
    try {
      const lead = await contactsApi.getLeadById(leadId);
      setSelectedLead(lead);
      setIsEditingLead(false);
      setEditForm({});
    } catch (error) {
      console.error('Erreur chargement lead:', error);
    }
  };

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
    if (!loading) {
      void loadLeads();
      void loadCompanies();
      void loadContacts();
    }
  }, [loading, loadLeads, loadCompanies, loadContacts]);

  // Mettre à jour les contacts filtrés en fonction de l'entreprise sélectionnée
  useEffect(() => {
    if (createForm.company_id) {
      const filtered = contacts.filter(c => c.company_id === createForm.company_id);
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [createForm.company_id, contacts]);

  // Quand un contact est sélectionné dans createForm, auto-sélectionner son entreprise
  useEffect(() => {
    if (createForm.contact_id) {
      const selectedContact = contacts.find(c => c.id === createForm.contact_id);
      if (selectedContact && selectedContact.company_id && selectedContact.company_id !== createForm.company_id) {
        setCreateForm((prev: any) => ({ ...prev, company_id: selectedContact.company_id || '' }));
      }
    }
  }, [createForm.contact_id, contacts, createForm.company_id]);

  // Quand une entreprise est sélectionnée dans editForm, filtrer les contacts
  useEffect(() => {
    if (isEditingLead && editForm.company_id) {
      const filtered = contacts.filter(c => c.company_id === editForm.company_id);
      setFilteredContacts(filtered);
    } else if (isEditingLead) {
      setFilteredContacts(contacts);
    }
  }, [editForm.company_id, contacts, isEditingLead]);

  // Quand un contact est sélectionné dans editForm, auto-sélectionner son entreprise
  useEffect(() => {
    if (isEditingLead && editForm.contact_id) {
      const selectedContact = contacts.find(c => c.id === editForm.contact_id);
      if (selectedContact && selectedContact.company_id && selectedContact.company_id !== editForm.company_id) {
        setEditForm((prev: any) => ({ ...prev, company_id: selectedContact.company_id || '' }));
      }
    }
  }, [editForm.contact_id, contacts, editForm.company_id, isEditingLead]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/login';
  };

  const statuses = [
    { id: 'nouveau', label: 'Nouveau', color: 'bg-blue-500' },
    { id: 'en cours', label: 'En Cours', color: 'bg-yellow-500' },
    { id: 'converti', label: 'Converti', color: 'bg-green-500' },
    { id: 'perdu', label: 'Perdu', color: 'bg-red-500' }
  ];

  const filteredLeads = filterStatus ? leads.filter(l => l.status === filterStatus) : leads;
  const totalValue = leads.reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0);

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Chargement des leads...</div>;
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
          <h1 className="text-2xl font-black text-blue-700 italic tracking-tighter">Leads</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Pipeline de Vente</h2>
              <p className="text-slate-500 font-semibold">Valeur totale: {totalValue.toLocaleString()} €</p>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(true);
                setCreateForm({
                  title: '',
                  estimated_value: '',
                  status: 'nouveau',
                  company_id: '',
                  contact_id: '',
                  source: '',
                  description: '',
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
            >
              + Nouveau Lead
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {statuses.map(status => (
              <button
                key={status.id}
                onClick={() => setFilterStatus(filterStatus === status.id ? null : status.id)}
                className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                  filterStatus === status.id
                    ? 'bg-slate-100 border-slate-400'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                  <h3 className="font-bold text-slate-700 text-sm">{status.label}</h3>
                  <span className="ml-auto bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                    {leads.filter(l => l.status === status.id).length}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredLeads.map(lead => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="w-full text-left p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{lead.title}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {lead.contacts?.first_name} {lead.contacts?.last_name}
                    </p>
                    {lead.source && <p className="text-xs text-slate-400 mt-1">Source: {lead.source}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700">{(lead.estimated_value || 0).toLocaleString()} €</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold text-white ${
                      lead.status === 'nouveau' ? 'bg-blue-500' :
                      lead.status === 'en cours' ? 'bg-yellow-500' :
                      lead.status === 'converti' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {filteredLeads.length === 0 && (
              <div className="p-6 text-center text-slate-400 italic">
                Aucun lead trouvé.
              </div>
            )}
          </div>
        </div>
      </div>

      {/*Modale création lead */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Créer un nouveau lead</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Titre du lead"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded"
              />
              <input
                type="number"
                placeholder="Valeur estimée"
                value={createForm.estimated_value}
                onChange={(e) => setCreateForm({ ...createForm, estimated_value: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded"
              />
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded bg-white"
              >
                <option value="nouveau">Nouveau</option>
                <option value="en cours">En Cours</option>
                <option value="converti">Converti</option>
                <option value="perdu">Perdu</option>
              </select>
              <select
                value={createForm.company_id}
                onChange={(e) => setCreateForm({ ...createForm, company_id: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded bg-white"
              >
                <option value="">Sélectionner une entreprise</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <select
                value={createForm.contact_id}
                onChange={(e) => setCreateForm({ ...createForm, contact_id: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded bg-white"
              >
                <option value="">Sélectionner un contact</option>
                {filteredContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Source"
                value={createForm.source}
                onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded"
              />
              <textarea
                placeholder="Description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full border border-slate-300 p-2 rounded"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => void handleCreateLead()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                >
                  Créer
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded font-bold hover:bg-gray-500"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*Modale détail lead */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedLead.title}</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Fermer
              </button>
            </div>

            {isEditingLead ? (
              <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded">
                <input
                  type="text"
                  placeholder="Titre"
                  value={editForm.title ?? selectedLead.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Valeur estimée"
                  value={editForm.estimated_value ?? selectedLead.estimated_value ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, estimated_value: Number(e.target.value) })}
                  className="w-full border border-slate-300 p-2 rounded"
                />
                <select
                  value={editForm.status ?? selectedLead.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded bg-white"
                >
                  <option value="nouveau">Nouveau</option>
                  <option value="en cours">En Cours</option>
                  <option value="converti">Converti</option>
                  <option value="perdu">Perdu</option>
                </select>
                <select
                  value={editForm.company_id ?? selectedLead.company_id ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, company_id: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded bg-white"
                >
                  <option value="">Aucune entreprise</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <select
                  value={editForm.contact_id ?? selectedLead.contact_id ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, contact_id: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded bg-white"
                >
                  <option value="">Aucun contact</option>
                  {filteredContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Source"
                  value={editForm.source ?? selectedLead.source ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded"
                />
                <textarea
                  placeholder="Description"
                  value={editForm.description ?? selectedLead.description ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border border-slate-300 p-2 rounded"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleSaveLead()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingLead(false);
                      setEditForm({});
                    }}
                    className="flex-1 px-4 py-2 bg-gray-400 text-white rounded font-bold hover:bg-gray-500"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <span className="font-semibold text-slate-700">Valeur:</span>
                    <p className="text-blue-700 font-bold text-lg">{(selectedLead.estimated_value || 0).toLocaleString()} €</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Statut:</span>
                    <p>
                      <span className="inline-block px-3 py-1 rounded-full text-white text-sm font-semibold"
                        style={{
                          backgroundColor:
                            selectedLead.status === 'nouveau' ? '#3b82f6' :
                            selectedLead.status === 'en cours' ? '#eab308' :
                            selectedLead.status === 'converti' ? '#22c55e' : '#ef4444'
                        }}
                      >
                        {statuses.find(s => s.id === selectedLead.status)?.label}
                      </span>
                    </p>
                  </div>

                  {selectedLead.companies && (
                    <div>
                      <span className="font-semibold text-slate-700">Entreprise:</span>
                      <p>{selectedLead.companies.name}</p>
                    </div>
                  )}

                  {selectedLead.source && (
                    <div>
                      <span className="font-semibold text-slate-700">Source:</span>
                      <p>{selectedLead.source}</p>
                    </div>
                  )}

                  {selectedLead.contacts && (
                    <div>
                      <span className="font-semibold text-slate-700">Contact:</span>
                      <p>{selectedLead.contacts.first_name} {selectedLead.contacts.last_name}</p>
                    </div>
                  )}

                  {selectedLead.assigned_commercial && (
                    <div>
                      <span className="font-semibold text-slate-700">Commercial assigné:</span>
                      <p>{selectedLead.assigned_commercial.email || 'Non assigné'}</p>
                    </div>
                  )}

                  {selectedLead.description && (
                    <div>
                      <span className="font-semibold text-slate-700">Description:</span>
                      <p className="mt-1 text-slate-600">{selectedLead.description}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingLead(true)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => void handleDeleteLead()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
