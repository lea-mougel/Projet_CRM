import React, { useState, useEffect, useCallback } from 'react';
import { contactsApi, CompanyDetails, Contact, ContactNote } from '../api/contacts.api';
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);
  const [activeTab, setActiveTab] = useState<'infos' | 'historique'>('infos');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'appel' | 'email' | 'réunion'>('note');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const includeAll = mode === 'all';

  const loadContacts = useCallback(async () => {
    const data = await contactsApi.getAll(search, includeAll);
    setContacts(data);
  }, [includeAll, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadContacts();
    }, 0);

    return () => clearTimeout(timer);
  }, [currentUser, loadContacts]);

  const visibleContacts =
    mode === 'my' && currentUser.role === 'commercial'
      ? contacts.filter((contact) => !contact.assigned_to || contact.assigned_to === currentUser.id)
      : contacts;

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

  const handleOpenContact = async (id: string) => {
    const contact = await contactsApi.getById(id, includeAll);
    setSelectedContact(contact);
    setSelectedCompany(null);
    setActiveTab('infos');
    setNoteContent('');
    setNoteType('note');
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
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="border p-2 rounded"
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            onClick={() => {
              if (isFormOpen) {
                closeForm();
              } else {
                setEditingContact(null);
                setIsFormOpen(true);
              }
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            {isFormOpen ? 'Annuler' : '+ Nouveau'}
          </button>
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
              <th className="p-4">Commercial</th>
              <th className="p-4 text-right">Actions</th>
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
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingContact(c);
                        setIsFormOpen(true);
                      }}
                      className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => void handleDelete(c.id)}
                      className="px-3 py-1 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
                    >
                      Supprimer
                    </button>
                  </div>
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
              <div className="space-y-3 text-base">
                <p><span className="font-semibold">Nom :</span> {selectedContact.first_name} {selectedContact.last_name}</p>
                <p><span className="font-semibold">Email :</span> {selectedContact.email}</p>
                <p><span className="font-semibold">Téléphone :</span> {selectedContact.phone || 'Non renseigné'}</p>
                <p><span className="font-semibold">Commercial :</span> {selectedContact.assigned_commercial?.email || 'Non assigné'}</p>
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