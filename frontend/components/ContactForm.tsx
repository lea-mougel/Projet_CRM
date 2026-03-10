import React, { useCallback, useEffect, useState } from 'react';
import { contactsApi, Contact, ContactPayload, CompanyListItem, CompanyPayload } from '../api/contacts.api';

type ContactFormProps = {
  onSaved: () => void;
  contactToEdit?: Contact | null;
  onCancel?: () => void;
};

const CLIENT_TYPES = ['Ingenieur d\'etudes', 'Responsable Innovation', 'Directeur de Production'] as const;

const ContactForm = ({ onSaved, contactToEdit = null, onCancel }: ContactFormProps) => {
  const [form, setForm] = useState<ContactPayload>({
    first_name: contactToEdit?.first_name ?? '',
    last_name: contactToEdit?.last_name ?? '',
    email: contactToEdit?.email ?? '',
    phone: contactToEdit?.phone ?? '',
    company_id: contactToEdit?.company_id ?? null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientType, setClientType] = useState<string>('');
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState<CompanyPayload>({
    name: '',
    industry: '',
    website: '',
    address: '',
    town: '',
  });
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  const loadCompanies = useCallback(async () => {
    const data = await contactsApi.getCompanies();
    setCompanies(data);
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (contactToEdit?.id) {
        await contactsApi.update(contactToEdit.id, form);
      } else {
        const created = await contactsApi.create(form);
        if (clientType) {
          await contactsApi.createContactNote(created.id, `Type de client: ${clientType}`, 'note');
        }
      }
      onSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreatingCompany(true);

    try {
      const newCompany = await contactsApi.createCompany(newCompanyForm);
      setCompanies([...companies, newCompany]);
      setForm({ ...form, company_id: newCompany.id });
      setShowCreateCompany(false);
      setNewCompanyForm({
        name: '',
        industry: '',
        website: '',
        address: '',
        town: '',
      });
    } finally {
      setIsCreatingCompany(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-blue-50 rounded-lg grid grid-cols-2 gap-4">
        <input
          placeholder="Prénom"
          className="p-2 border rounded"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          required
        />
        <input
          placeholder="Nom"
          className="p-2 border rounded"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="p-2 border rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          placeholder="Téléphone"
          className="p-2 border rounded"
          value={form.phone ?? ''}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <select
          className="p-2 border rounded"
          value={clientType}
          onChange={(e) => setClientType(e.target.value)}
        >
          <option value="">Type de client (optionnel)</option>
          {CLIENT_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <div className="col-span-2">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1">Entreprise</label>
              <select
                value={form.company_id ?? ''}
                onChange={(e) => setForm({ ...form, company_id: e.target.value ? e.target.value : null })}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Aucune entreprise --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateCompany(true)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              +
            </button>
          </div>
        </div>
        <div className="col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-70"
          >
            {contactToEdit ? 'Modifier' : 'Enregistrer'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      {showCreateCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Créer une entreprise</h2>
              <button
                onClick={() => setShowCreateCompany(false)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              >
                Fermer
              </button>
            </div>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nom</label>
                <input
                  type="text"
                  placeholder="Nom de l'entreprise"
                  className="w-full p-2 border rounded"
                  value={newCompanyForm.name}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Secteur</label>
                <input
                  type="text"
                  placeholder="Secteur d'activité"
                  className="w-full p-2 border rounded"
                  value={newCompanyForm.industry ?? ''}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, industry: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Ville</label>
                <input
                  type="text"
                  placeholder="Ville"
                  className="w-full p-2 border rounded"
                  value={newCompanyForm.town ?? ''}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, town: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Adresse</label>
                <input
                  type="text"
                  placeholder="Adresse"
                  className="w-full p-2 border rounded"
                  value={newCompanyForm.address ?? ''}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Site web</label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full p-2 border rounded"
                  value={newCompanyForm.website ?? ''}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, website: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreatingCompany}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-70"
                >
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCompany(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactForm;