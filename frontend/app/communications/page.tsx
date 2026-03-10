'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { contactsApi, AutomationSettings, Communication, Contact, Lead } from '../../api/contacts.api';

type CurrentUser = {
  id: string;
  role: string;
};

type CommercialProfile = {
  id: string;
  email: string;
  role: string;
};

// Module-level cache — survives client-side navigation
type CommsCache = {
  currentUser: CurrentUser;
  communications: Communication[];
  contacts: Contact[];
  leads: Lead[];
  commercials: CommercialProfile[];
};
let _commsCache: CommsCache | null = null;

export default function CommunicationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(_commsCache?.currentUser ?? null);
  const [communications, setCommunications] = useState<Communication[]>(_commsCache?.communications ?? []);
  const [contacts, setContacts] = useState<Contact[]>(_commsCache?.contacts ?? []);
  const [leads, setLeads] = useState<Lead[]>(_commsCache?.leads ?? []);
  const [commercials, setCommercials] = useState<CommercialProfile[]>(_commsCache?.commercials ?? []);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
  const [recipientType, setRecipientType] = useState<'contact' | 'lead' | 'commercial' | 'custom'>('contact');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedCommercialId, setSelectedCommercialId] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [sendRecipientEmail, setSendRecipientEmail] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [automationEnabled, setAutomationEnabled] = useState<boolean>(true);
  const [automationSubject, setAutomationSubject] = useState<string>('Votre dossier est en cours de traitement');
  const [automationBody, setAutomationBody] = useState<string>('<p>Bonjour,</p><p>Votre dossier <strong>{{lead_title}}</strong> est désormais en cours de traitement.</p><p>Notre équipe revient vers vous rapidement.</p>');
  const [automationCooldownHours, setAutomationCooldownHours] = useState<number>(24);
  const [automationDailyLimit, setAutomationDailyLimit] = useState<number>(2);
  const [automationTarget, setAutomationTarget] = useState<'contact' | 'commercial'>('contact');
  const [automationTargetCommercialId, setAutomationTargetCommercialId] = useState<string>('');
  const [automationTargetLeadId, setAutomationTargetLeadId] = useState<string>('');
  const [automationLoading, setAutomationLoading] = useState(false);
  const [automationMessage, setAutomationMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(_commsCache === null);

  const loadCommunications = async () => {
    const list = await contactsApi.getCommunications();
    setCommunications(list);
  };

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

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const profile = await contactsApi.getUserProfile(session.user.id);
        const role = profile?.role || 'user';
        if (role !== 'admin' && role !== 'commercial') {
          router.push('/');
          return;
        }

        const user: CurrentUser = { id: session.user.id, role };
        setCurrentUser(user);
        const [communicationsList, contactsList, leadsList] = await Promise.all([
          contactsApi.getCommunications(),
          contactsApi.getAll('', role === 'admin'),
          contactsApi.getAllLeads(),
        ]);
        setCommunications(communicationsList);
        setContacts(contactsList);
        setLeads(leadsList);

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, role')
          .in('role', ['commercial', 'admin'])
          .order('email');

        const typedCommercials = (profiles as CommercialProfile[]) ?? [];
        setCommercials(typedCommercials);

        // Save to module-level cache so returning to this page is instant
        _commsCache = {
          currentUser: user,
          communications: communicationsList,
          contacts: contactsList,
          leads: leadsList,
          commercials: typedCommercials,
        };

        if (role === 'admin') {
          try {
            const settings = await contactsApi.getAutomationSettings();
            applyAutomationSettings(settings);
          } catch (error) {
            console.error('Erreur chargement paramètres automation:', error);
          }
        }
      } catch (error) {
        console.error('Erreur chargement communications:', error);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [router, supabase]);

  const visibleCommunications = useMemo(() => {
    if (statusFilter === 'all') return communications;
    return communications.filter((item) => item.status === statusFilter);
  }, [communications, statusFilter]);

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) => {
      const searchable = [
        contact.first_name,
        contact.last_name,
        contact.email,
        contact.company?.name || '',
        contact.phone || '',
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [contacts, contactSearch]);

  const handleManualSend = async () => {
    if (recipientType !== 'custom' && !sendRecipientEmail.trim()) {
      setSendMessage('Sélectionne un destinataire valide.');
      return;
    }

    if (!sendRecipientEmail.trim() || !sendSubject.trim()) {
      setSendMessage('Email destinataire et sujet sont obligatoires.');
      return;
    }

    try {
      setSending(true);
      setSendMessage(null);

      await contactsApi.sendCommunication({
        recipient_email: sendRecipientEmail.trim(),
        subject: sendSubject.trim(),
        body: sendBody.trim() || undefined,
        contact_id: selectedContactId || undefined,
        lead_id: selectedLeadId || undefined,
        trigger_type: 'manual',
      });

      setSendMessage('Email envoyé et historisé.');
      setRecipientType('contact');
      setSelectedContactId('');
      setSelectedLeadId('');
      setSelectedCommercialId('');
      setSendRecipientEmail('');
      setSendSubject('');
      setSendBody('');
      await loadCommunications();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setSendMessage(`Échec envoi: ${message}`);
    } finally {
      setSending(false);
    }
  };

  const applyAutomationSettings = (settings: AutomationSettings) => {
    setAutomationEnabled(Boolean(settings.enabled));
    setAutomationSubject(settings.subject);
    setAutomationBody(settings.body);
    setAutomationCooldownHours(settings.cooldown_hours);
    setAutomationDailyLimit(settings.daily_limit_per_recipient);
    setAutomationTarget(settings.target);
    setAutomationTargetCommercialId(settings.target_commercial_id || '');
    setAutomationTargetLeadId(settings.target_lead_id || '');
  };

  const toggleAutomation = async () => {
    try {
      setAutomationLoading(true);
      setAutomationMessage(null);
      const nextValue = !automationEnabled;
      const settings = await contactsApi.updateAutomationSettings({ enabled: nextValue });
      applyAutomationSettings(settings);
      setAutomationMessage(nextValue ? 'Envois automatiques activés.' : 'Envois automatiques désactivés.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setAutomationMessage(`Échec mise à jour: ${message}`);
    } finally {
      setAutomationLoading(false);
    }
  };

  const saveAutomationConfig = async () => {
    try {
      setAutomationLoading(true);
      setAutomationMessage(null);
      const settings = await contactsApi.updateAutomationSettings({
        enabled: automationEnabled,
        subject: automationSubject,
        body: automationBody,
        cooldown_hours: Math.max(0, automationCooldownHours),
        daily_limit_per_recipient: Math.max(1, automationDailyLimit),
        target: automationTarget,
        target_commercial_id: automationTarget === 'commercial' ? (automationTargetCommercialId || null) : null,
        target_lead_id: automationTargetLeadId || null,
      });
      applyAutomationSettings(settings);
      setAutomationMessage('Configuration auto-envoi enregistrée.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setAutomationMessage(`Échec enregistrement: ${message}`);
    } finally {
      setAutomationLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Chargement des communications...</div>;
  }

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId);
  const selectedContact = contacts.find((contact) => contact.id === selectedContactId);
  const selectedCommercial = commercials.find((commercial) => commercial.id === selectedCommercialId);
  const isAdmin = currentUser?.role === 'admin';

  const formatContactLabel = (contact: Contact) => {
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contact sans nom';
    const companyName = contact.company?.name ? ` • ${contact.company.name}` : '';
    const idShort = contact.id.slice(0, 8);
    return `${fullName} • ${contact.email}${companyName} • #${idShort}`;
  };

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    if (!contactId) return;

    const contact = contacts.find((item) => item.id === contactId);
    if (contact?.email) {
      setSendRecipientEmail(contact.email);
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (!leadId) return;

    const lead = leads.find((item) => item.id === leadId);
    if (lead?.contacts?.email) {
      setSendRecipientEmail(lead.contacts.email);
    }
    if (lead?.title && !sendSubject.trim()) {
      setSendSubject(`Suivi de votre dossier: ${lead.title}`);
    }
  };

  const handleSelectCommercial = (commercialId: string) => {
    setSelectedCommercialId(commercialId);
    if (!commercialId) return;

    const commercial = commercials.find((item) => item.id === commercialId);
    if (commercial?.email) {
      setSendRecipientEmail(commercial.email);
    }
  };

  const handleRecipientTypeChange = (value: 'contact' | 'lead' | 'commercial' | 'custom') => {
    setRecipientType(value);
    setSelectedContactId('');
    setSelectedLeadId('');
    setSelectedCommercialId('');
    setContactSearch('');
    setSendRecipientEmail('');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b-2 border-slate-200 p-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-blue-700 italic tracking-tighter">Historique communications</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'sent' | 'failed')}
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm font-semibold"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="sent">Envoyé</option>
            <option value="failed">Échec</option>
          </select>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {isAdmin && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-black text-slate-800 uppercase mb-4">Configuration auto-envoi</h2>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                onClick={toggleAutomation}
                disabled={automationLoading}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition border ${
                  automationEnabled
                    ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600'
                    : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                } disabled:opacity-60`}
              >
                {automationLoading ? 'Mise à jour...' : automationEnabled ? 'Auto-envoi: Activé' : 'Auto-envoi: Désactivé'}
              </button>
              {automationMessage && <p className="text-sm text-slate-600">{automationMessage}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Cible des mails auto</label>
                <select
                  value={automationTarget}
                  onChange={(e) => setAutomationTarget(e.target.value as 'contact' | 'commercial')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white"
                >
                  <option value="contact">Contact du lead</option>
                  <option value="commercial">Commercial assigné</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Lead ciblé (optionnel)</label>
                <select
                  value={automationTargetLeadId}
                  onChange={(e) => setAutomationTargetLeadId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white"
                >
                  <option value="">Tous les leads</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {(lead.title || 'Lead sans titre')} — {lead.contacts?.email || 'sans email'}
                    </option>
                  ))}
                </select>
              </div>
              {automationTarget === 'commercial' && (
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Commercial ciblé (optionnel)</label>
                  <select
                    value={automationTargetCommercialId}
                    onChange={(e) => setAutomationTargetCommercialId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white"
                  >
                    <option value="">Commercial assigné du lead</option>
                    {commercials.map((commercial) => (
                      <option key={commercial.id} value={commercial.id}>
                        {commercial.email} — {commercial.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Fréquence min par lead (heures)</label>
                <input
                  type="number"
                  min={0}
                  value={automationCooldownHours}
                  onChange={(e) => setAutomationCooldownHours(Number(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Limite/jour par destinataire</label>
              <input
                type="number"
                min={1}
                value={automationDailyLimit}
                onChange={(e) => setAutomationDailyLimit(Math.max(1, Number(e.target.value) || 1))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
              />
            </div>
            <div className="mb-3">
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Objet du mail auto</label>
              <input
                value={automationSubject}
                onChange={(e) => setAutomationSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                placeholder="Votre dossier est en cours de traitement"
              />
            </div>
            <div className="mb-3">
              <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Contenu HTML (supporte {'{{lead_title}}'})</label>
              <textarea
                value={automationBody}
                onChange={(e) => setAutomationBody(e.target.value)}
                rows={4}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
              />
            </div>
            <button
              onClick={saveAutomationConfig}
              disabled={automationLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-black uppercase hover:bg-blue-700 disabled:opacity-60"
            >
              {automationLoading ? 'Enregistrement...' : 'Enregistrer la configuration'}
            </button>
          </section>
        )}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-black text-slate-800 uppercase mb-4">Envoyer un email manuel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <select
              value={recipientType}
              onChange={(e) => handleRecipientTypeChange(e.target.value as 'contact' | 'lead' | 'commercial' | 'custom')}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white"
            >
              <option value="contact">Destinataire: Contact</option>
              <option value="lead">Destinataire: Lead</option>
              <option value="commercial">Destinataire: Commercial</option>
              <option value="custom">Destinataire: Email libre</option>
            </select>
            {recipientType === 'custom' ? (
              <input
                type="email"
                value={sendRecipientEmail}
                onChange={(e) => setSendRecipientEmail(e.target.value)}
                placeholder="Destinataire (email)"
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
              />
            ) : recipientType === 'contact' ? (
              <div>
                <input
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Rechercher un contact (nom, email, entreprise...)"
                  className="mb-2 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
                />
                <select
                  value={selectedContactId}
                  onChange={(e) => handleSelectContact(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white"
                >
                  <option value="">Choisir un contact</option>
                  {filteredContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {formatContactLabel(contact)}
                    </option>
                  ))}
                </select>
              </div>
            ) : recipientType === 'lead' ? (
              <select
                value={selectedLeadId}
                onChange={(e) => handleSelectLead(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white"
              >
                <option value="">Choisir un lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {(lead.title || 'Lead sans titre')} — {lead.contacts?.email || 'sans email'}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedCommercialId}
                onChange={(e) => handleSelectCommercial(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white"
              >
                <option value="">Choisir un commercial</option>
                {commercials.map((commercial) => (
                  <option key={commercial.id} value={commercial.id}>
                    {commercial.email} — {commercial.role}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="email"
              value={sendRecipientEmail}
              onChange={(e) => setSendRecipientEmail(e.target.value)}
              placeholder="Destinataire (email)"
              disabled={recipientType !== 'custom'}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold disabled:bg-slate-100 disabled:text-slate-500"
            />
            <input
              type="text"
              value={sendSubject}
              onChange={(e) => setSendSubject(e.target.value)}
              placeholder="Sujet"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
            />
          </div>
          {selectedContact && (
            <p className="mt-2 text-xs text-slate-500">
              Contact sélectionné: {selectedContact.first_name} {selectedContact.last_name} — {selectedContact.email}
              {selectedContact.company?.name ? ` • ${selectedContact.company.name}` : ''}
            </p>
          )}
          {selectedLead && (
            <p className="mt-2 text-xs text-slate-500">
              Lead sélectionné: {selectedLead.title || 'Sans titre'} ({selectedLead.status})
            </p>
          )}
          {selectedCommercial && (
            <p className="mt-2 text-xs text-slate-500">
              Commercial sélectionné: {selectedCommercial.email} ({selectedCommercial.role})
            </p>
          )}
          <textarea
            value={sendBody}
            onChange={(e) => setSendBody(e.target.value)}
            placeholder="Contenu HTML (optionnel)"
            rows={4}
            className="mt-3 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleManualSend}
              disabled={sending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-black uppercase hover:bg-blue-700 disabled:opacity-60"
            >
              {sending ? 'Envoi...' : 'Envoyer'}
            </button>
            {sendMessage && <p className="text-sm text-slate-600">{sendMessage}</p>}
          </div>
        </section>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-bold text-slate-700">Date</th>
                <th className="text-left py-3 px-4 font-bold text-slate-700">Destinataire</th>
                <th className="text-left py-3 px-4 font-bold text-slate-700">Sujet</th>
                <th className="text-left py-3 px-4 font-bold text-slate-700">Type</th>
                <th className="text-left py-3 px-4 font-bold text-slate-700">Statut</th>
              </tr>
            </thead>
            <tbody>
              {visibleCommunications.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-600">{new Date(item.created_at).toLocaleString('fr-FR')}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.recipient_email}</td>
                  <td className="py-3 px-4 text-slate-700">{item.subject}</td>
                  <td className="py-3 px-4 text-slate-600 uppercase text-[11px] font-black">{item.trigger_type}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                        item.status === 'sent'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.status === 'failed' && item.error_message && (
                      <p className="text-[10px] text-red-600 mt-1 max-w-xs truncate">{item.error_message}</p>
                    )}
                  </td>
                </tr>
              ))}
              {visibleCommunications.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 italic">
                    Aucune communication à afficher.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
