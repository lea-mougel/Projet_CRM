import React, { useState, useEffect, useCallback } from 'react';
import { contactsApi, CompanyDetails, Contact, ContactNote, CompanyListItem } from '../api/contacts.api';
import ContactForm from './ContactForm';

type ContactListProps = {
  currentUser: {
    id: string;
    role: string;
  };
  mode?: 'my' | 'all';
};

const ContactList = ({ currentUser, mode = 'all' }: ContactListProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [filterCommercial, setFilterCommercial] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [commercials, setCommercials] = useState<Array<{ id: string; email: string }>>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);
  const [activeTab, setActiveTab] = useState<'infos' | 'historique'>('infos');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'appel' | 'email' | 'réunion'>('note');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [editForm, setEditForm] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company_id?: string | null;
  }>({});
  const includeAll = mode === 'all';

  const loadContacts = useCallback(async () => {
    const data = await contactsApi.getAll(search, includeAll);
    setContacts(data);
  }, [includeAll, search]);

  useEffect(() => {
    // Charger les entreprises et commerciaux pour les filtres
    const loadFiltersData = async () => {
      const companiesList = await contactsApi.getCompanies();
      setCompanies(companiesList);
    };
    void loadFiltersData();
  }, []);

  useEffect(() => {
    // Extraire les commerciaux uniques des contacts
    const uniqueCommercials = Array.from(
      new Map(
        contacts
          .filter(c => c.assigned_commercial?.email)
          .map(c => [c.assigned_to!, { id: c.assigned_to!, email: c.assigned_commercial?.email || '' }])
      ).values()
    );
    setCommercials(uniqueCommercials);
  }, [contacts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadContacts();
    }, 0);

    return () => clearTimeout(timer);
  }, [currentUser, loadContacts]);

  const visibleContacts = (() => {
    let filtered = 
      mode === 'my' && currentUser.role === 'commercial'
        ? contacts.filter((contact) => !contact.assigned_to || contact.assigned_to === currentUser.id)
        : contacts;

    // Filtre par commercial assigné
    if (filterCommercial) {
      if (filterCommercial === 'null') {
        filtered = filtered.filter((contact) => !contact.assigned_to);
      } else {
        filtered = filtered.filter((contact) => contact.assigned_to === filterCommercial);
      }
    }

    // Filtre par entreprise
    if (filterCompany) {
      filtered = filtered.filter((contact) => contact.company_id === filterCompany);
    }

    return filtered;
  })();

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Supprimer ce contact ?');
    if (!confirmed) return;
    await contactsApi.remove(id);
    await loadContacts();
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
  };

  const handleSaveContact = async () => {
    if (!selectedContact) return;
    try {
      const updates: any = {};
      const changes: string[] = [];

      // Comparer et enregistrer les changements
      if (editForm.first_name !== undefined && editForm.first_name !== selectedContact.first_name) {
        updates.first_name = editForm.first_name;
        changes.push(`Prénom: "${selectedContact.first_name}" → "${editForm.first_name}"`);
      }
      if (editForm.last_name !== undefined && editForm.last_name !== selectedContact.last_name) {
        updates.last_name = editForm.last_name;
        changes.push(`Nom: "${selectedContact.last_name}" → "${editForm.last_name}"`);
      }
      if (editForm.email !== undefined && editForm.email !== selectedContact.email) {
        updates.email = editForm.email;
        changes.push(`Email: "${selectedContact.email}" → "${editForm.email}"`);
      }
      const phoneOld = selectedContact.phone || 'Non fourni';
      const phoneNew = editForm.phone || 'Non fourni';
      if (editForm.phone !== undefined && phoneNew !== phoneOld) {
        updates.phone = editForm.phone;
        changes.push(`Téléphone: "${phoneOld}" → "${phoneNew}"`);
      }
      const companyOld = selectedContact.company?.name || 'Indépendant';
      const companyNew = editForm.company_id
        ? companies.find(c => c.id === editForm.company_id)?.name || 'Entreprise'
        : 'Indépendant';
      if (editForm.company_id !== undefined && editForm.company_id !== selectedContact.company_id) {
        updates.company_id = editForm.company_id;
        changes.push(`Entreprise: "${companyOld}" → "${companyNew}"`);
      }

      if (Object.keys(updates).length === 0) {
        // Aucun changement
        setIsEditingContact(false);
        setEditForm({});
        return;
      }

      // Sauvegarder le contact
      await contactsApi.update(selectedContact.id, updates);
      const updatedContact = await contactsApi.getById(selectedContact.id, includeAll);
      setSelectedContact(updatedContact);
      setIsEditingContact(false);
      setEditForm({});

      // Créer une note automatique documentant les changements
      const changesSummary = changes.join('\n');
      const noteMessage = `Modifications:\n${changesSummary}`;
      await contactsApi.createContactNote(selectedContact.id, noteMessage, 'note');

      // Recharger les notes
      await loadContactNotes(selectedContact.id);
      await loadContacts();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du contact');
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;
    const confirmed = window.confirm('Supprimer ce contact ?');
    if (!confirmed) return;
    try {
      await contactsApi.remove(selectedContact.id);
      setSelectedContact(null);
      await loadContacts();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du contact');
    }
  };

  const handleOpenContact = async (id: string) => {
    const contact = await contactsApi.getById(id, includeAll);
    setSelectedContact(contact);
    setSelectedCompany(null);
    setActiveTab('infos');
    setNoteContent('');
    setNoteType('note');
    setIsEditingContact(false);
    setEditForm({});
    // Charger les notes du contact
    void loadContactNotes(id);
  };

  const loadContactNotes = async (contactId: string) => {
    setIsLoadingNotes(true);
    const notes = await contactsApi.getContactNotes(contactId);
    setContactNotes(notes);
    setIsLoadingNotes(false);
  };

  const handleAddNote = async () => {
    if (!selectedContact || !noteContent.trim()) return;
    await contactsApi.createContactNote(selectedContact.id, noteContent, noteType);
    setNoteContent('');
    setNoteType('note');
    await loadContactNotes(selectedContact.id);
  };

  const handleOpenCompany = async (companyId?: string) => {
    if (!companyId) return;
    const company = await contactsApi.getCompanyById(companyId, includeAll);
    setSelectedContact(null);
    setSelectedCompany(company);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{mode === 'my' ? 'Mes contacts' : 'Contacts'}</h1>
        <button 
          onClick={() => {
            if (isFormOpen) {
              closeForm();
            } else {
              setEditingContact(null);
              setIsFormOpen(true);
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
        >
          {isFormOpen ? 'Fermer' : '+ Créer un contact'}
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <input 
            type="text" 
            placeholder="Rechercher par nom, email, téléphone..." 
            className="flex-1 min-w-[200px] border border-slate-300 p-2 rounded"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
          <select 
            value={filterCommercial}
            onChange={(e) => setFilterCommercial(e.target.value)}
            className="border border-slate-300 p-2 rounded bg-white"
          >
            <option value="">Tous les commerciaux</option>
            <option value="null">Non assigné</option>
            {commercials.map((commercial) => (
              <option key={commercial.id} value={commercial.id}>
                {commercial.email}
              </option>
            ))}
          </select>
          <select 
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="border border-slate-300 p-2 rounded bg-white"
          >
            <option value="">Toutes les entreprises</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          {(filterCommercial || filterCompany || search) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterCommercial('');
                setFilterCompany('');
              }}
              className="px-3 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 font-semibold"
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>
        <div className="text-sm text-slate-600">
          {visibleContacts.length} contact{visibleContacts.length !== 1 ? 's' : ''} trouvé{visibleContacts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {isFormOpen && (
        <ContactForm
          contactToEdit={editingContact}
          onSaved={() => {
            void loadContacts();
            closeForm();
          }}
          onCancel={closeForm}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Contact</th>
              <th className="p-4">Entreprise</th>
              <th className="p-4">Commercial (contact principal)</th>
            </tr>
          </thead>
          <tbody>
            {visibleContacts.map((c) => (
              <tr key={c.id} className="border-b hover:bg-slate-50 transition cursor-pointer">
                <td
                  className="p-4"
                  onClick={() => void handleOpenContact(c.id)}
                >
                  <div className="font-semibold text-left">{c.first_name} {c.last_name}</div>
                  <div className="text-sm text-gray-500">{c.email}</div>
                </td>
                <td
                  className="p-4"
                  onClick={() => void handleOpenContact(c.id)}
                >
                  {c.company?.name || 'Indépendant'}
                </td>
                <td
                  className="p-4 text-sm italic"
                  onClick={() => void handleOpenContact(c.id)}
                >
                  {c.assigned_commercial?.email || 'Non assigné'}
                </td>
              </tr>
            ))}
            {visibleContacts.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500 italic">
                  Aucun contact disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Détail du contact</h2>
              <button
                onClick={() => setSelectedContact(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Fermer
              </button>
            </div>

            {/* Onglets */}
            <div className="flex gap-4 mb-6 border-b">
              <button
                onClick={() => setActiveTab('infos')}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === 'infos'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Informations
              </button>
              <button
                onClick={() => setActiveTab('historique')}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === 'historique'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Historique
              </button>
            </div>

            {/* Onglet Informations */}
            {activeTab === 'infos' && (
              <>
                {isEditingContact ? (
                  <div className="space-y-4 mb-6 bg-slate-50 p-4 rounded">
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={editForm.first_name ?? selectedContact.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full border border-slate-300 p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Nom"
                      value={editForm.last_name ?? selectedContact.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full border border-slate-300 p-2 rounded"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={editForm.email ?? selectedContact.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full border border-slate-300 p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Téléphone"
                      value={editForm.phone ?? selectedContact.phone ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full border border-slate-300 p-2 rounded"
                    />
                    <select
                      value={editForm.company_id ?? selectedContact.company_id ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, company_id: e.target.value || null })}
                      className="w-full border border-slate-300 p-2 rounded bg-white"
                    >
                      <option value="">Indépendant</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleSaveContact()}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingContact(false);
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
                    <div className="space-y-3 text-base mb-6">
                      <p><span className="font-semibold">Nom :</span> {selectedContact.first_name} {selectedContact.last_name}</p>
                      <p><span className="font-semibold">Email :</span> {selectedContact.email}</p>
                      <p><span className="font-semibold">Téléphone :</span> {selectedContact.phone || 'Non renseigné'}</p>
                      <p><span className="font-semibold">Commercial (contact principal) :</span> {selectedContact.assigned_commercial?.email || 'Non assigné'}</p>
                      <div className="pt-2">
                        <span className="font-semibold">Entreprise :</span>{' '}
                        {selectedContact.company?.id ? (
                          <button
                            onClick={() => void handleOpenCompany(selectedContact.company?.id)}
                            className="text-blue-700 underline hover:text-blue-800"
                          >
                            {selectedContact.company?.name || 'Voir entreprise'}
                          </button>
                        ) : (
                          <span>Indépendant</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingContact(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => void handleDeleteContact()}
                        className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Onglet Historique */}
            {activeTab === 'historique' && (
              <div className="space-y-4">
                {/* Formulaire ajout note */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="block text-sm font-semibold mb-2">Ajouter une note</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as 'note' | 'appel' | 'email' | 'réunion')}
                    className="w-full p-2 border rounded mb-2 text-sm"
                  >
                    <option value="note">📝 Note</option>
                    <option value="appel">📞 Appel</option>
                    <option value="email">📧 Email</option>
                    <option value="réunion">🤝 Réunion</option>
                  </select>
                  <textarea
                    placeholder="Contenu de la note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full p-2 border rounded mb-3 text-sm"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    Ajouter
                  </button>
                </div>

                {/* Liste des notes */}
                {isLoadingNotes ? (
                  <p className="text-slate-400 text-sm">Chargement...</p>
                ) : contactNotes.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">Aucune note pour ce contact.</p>
                ) : (
                  <div className="space-y-3">
                    {contactNotes.map((note) => (
                      <div key={note.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-semibold text-slate-700">
                            {note.type === 'note' && '📝'}
                            {note.type === 'appel' && '📞'}
                            {note.type === 'email' && '📧'}
                            {note.type === 'réunion' && '🤝'}
                            {' '}{note.type.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(note.created_at).toLocaleDateString('fr-FR')}
                            {' '}
                            {new Date(note.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mb-1">{note.content}</p>
                        <p className="text-xs text-slate-400">Par: {note.author?.email || 'Anonyme'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Détail de l&apos;entreprise</h2>
              <button
                onClick={() => setSelectedCompany(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Fermer
              </button>
            </div>
            <p><span className="font-semibold">Nom :</span> {selectedCompany.name}</p>
            <p><span className="font-semibold">Secteur :</span> {selectedCompany.industry || 'Non renseigné'}</p>
            <p><span className="font-semibold">Ville :</span> {selectedCompany.town || 'Non renseignée'}</p>
            <p><span className="font-semibold">Adresse :</span> {selectedCompany.address || 'Non renseignée'}</p>
            <p><span className="font-semibold">Site :</span> {selectedCompany.website || 'Non renseigné'}</p>

            <h3 className="text-lg font-bold mt-6 mb-3">Contacts associés</h3>
            <div className="space-y-2">
              {selectedCompany.contacts.map((companyContact) => (
                <button
                  key={companyContact.id}
                  onClick={() => {
                    setSelectedCompany(null);
                    void handleOpenContact(companyContact.id);
                  }}
                  className="block w-full text-left border border-slate-200 rounded-lg p-3 hover:bg-gray-50 transition"
                >
                  <div className="font-semibold">{companyContact.first_name} {companyContact.last_name}</div>
                  <div className="text-sm text-gray-500">{companyContact.email}</div>
                </button>
              ))}
              {selectedCompany.contacts.length === 0 && (
                <p className="text-gray-500 italic">Aucun contact associé visible.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;