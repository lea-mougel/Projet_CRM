'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldAlert, Megaphone, Settings, Pencil } from 'lucide-react';
import { contactsApi } from '../api/contacts.api';

type DashboardSession = {
  user: {
    id: string;
  };
};

type ContactRecord = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  assigned_to: string | null;
  assigned_commercial?: {
    email?: string;
  };
};

type LeadRecord = {
  id: string;
  title?: string;
  status: string;
  estimated_value: number | string;
  created_at?: string;
  updated_at?: string;
};

type CommunicationRecord = {
  id: string;
  status: 'pending' | 'sent' | 'failed';
  trigger_type: 'manual' | 'automation';
  created_at?: string;
};

type TaskRecord = {
  id: string;
  title: string;
  due_date?: string | null;
  is_completed: boolean;
  contact?: {
    first_name?: string;
    last_name?: string;
  } | null;
  lead?: {
    title?: string;
  } | null;
};

type ProfileRecord = {
  id: string;
  email: string;
  role: string;
};

export default function Dashboard({ session }: { session: DashboardSession }) {
  const supabase = useMemo(() => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: true, storageKey: 'crm-auth-token' } }
  ), []);

  const [role, setRole] = useState<string>('chargement');
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [communications, setCommunications] = useState<CommunicationRecord[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileRecord[]>([]);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [taskView, setTaskView] = useState<'today' | 'tomorrow' | 'week'>('today');
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d' | 'month'>('month');
  const [hotLeadThreshold, setHotLeadThreshold] = useState<number>(10000);
  const [hotLeadThresholdDraft, setHotLeadThresholdDraft] = useState<string>('10000');
  const [isEditingHotLeadThreshold, setIsEditingHotLeadThreshold] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedThreshold = localStorage.getItem('crm-hot-lead-threshold');
    if (savedThreshold) {
      const parsed = Number(savedThreshold);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        setHotLeadThreshold(parsed);
        setHotLeadThresholdDraft(String(parsed));
      }
    }
  }, []);

  const saveHotLeadThreshold = () => {
    const nextValue = Math.max(0, Number(hotLeadThresholdDraft) || 0);
    setHotLeadThreshold(nextValue);
    setHotLeadThresholdDraft(String(nextValue));
    localStorage.setItem('crm-hot-lead-threshold', String(nextValue));
    setIsEditingHotLeadThreshold(false);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) console.error('Erreur Supabase :', error.message);

      if (profile) {
        setRole(profile.role);

        if (profile.role === 'admin' || profile.role === 'commercial') {
          const [contactsList, leadsList, tasksList, communicationsList] = await Promise.all([
            contactsApi.getAll('', profile.role === 'admin'),
            contactsApi.getAllLeads(),
            contactsApi.getAllTasks(),
            contactsApi.getCommunications(),
          ]);

          setContacts(contactsList as ContactRecord[]);
          setLeads(leadsList as LeadRecord[]);
          setTasks(tasksList as TaskRecord[]);
          setCommunications(communicationsList as CommunicationRecord[]);

          const { data: pro } = await supabase.from('profiles').select('*').order('email');
          if (pro) setAllProfiles(pro);
        }
      } else {
        setRole('user');
      }
    } catch (err) {
      console.error('Erreur système :', err);
    } finally {
      setLoading(false);
    }
  }, [session.user.id, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const assignContact = async (contactId: string, commercialId: string) => {
    const { error } = await supabase
      .from('contacts')
      .update({ assigned_to: commercialId === 'none' ? null : commercialId })
      .eq('id', contactId);

    if (!error) {
      setAdminMessage('Contact réassigné.');
      loadData();
    } else {
      setAdminMessage('Erreur : Permission refusée.');
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
      setAdminMessage('Erreur : Seul un Admin peut faire ça.');
    }
  };

  const totalValue = leads.reduce((acc, curr) => acc + (Number(curr.estimated_value) || 0), 0);
  const commercialsOnly = allProfiles.filter((p) => p.role === 'commercial' || p.role === 'admin');
  const visibleContacts =
    role === 'commercial'
      ? contacts.filter((contact) => !contact.assigned_to || contact.assigned_to === session.user.id)
      : contacts;
  const previewContacts = visibleContacts.slice(0, 3);

  const filteredTasks = useMemo(() => {
    const startOfDay = (date: Date) => {
      const value = new Date(date);
      value.setHours(0, 0, 0, 0);
      return value;
    };

    const endOfDay = (date: Date) => {
      const value = new Date(date);
      value.setHours(23, 59, 59, 999);
      return value;
    };

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const tomorrowStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    const tomorrowEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));

    const weekEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7));

    return tasks
      .filter((task) => !!task.due_date)
      .filter((task) => {
        const dueDate = new Date(task.due_date as string);
        if (taskView === 'today') return dueDate >= todayStart && dueDate <= todayEnd;
        if (taskView === 'tomorrow') return dueDate >= tomorrowStart && dueDate <= tomorrowEnd;
        return dueDate >= todayStart && dueDate <= weekEnd;
      })
      .sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime());
  }, [tasks, taskView]);

  const commercialLeadsChauds = useMemo(() => {
    return leads
      .filter((lead) => lead.status === 'en cours' || lead.status === 'nouveau')
      .filter((lead) => (Number(lead.estimated_value) || 0) >= hotLeadThreshold)
      .sort((a, b) => (Number(b.estimated_value) || 0) - (Number(a.estimated_value) || 0))
      .slice(0, 6);
  }, [leads, hotLeadThreshold]);

  const commercialAlerts = useMemo(() => {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const overdueTasks = tasks
      .filter((task) => !task.is_completed && !!task.due_date)
      .filter((task) => new Date(task.due_date as string) < now)
      .sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())
      .slice(0, 5);

    const dueSoonTasks = tasks
      .filter((task) => !task.is_completed && !!task.due_date)
      .filter((task) => {
        const dueDate = new Date(task.due_date as string);
        return dueDate >= now && dueDate <= in48h;
      })
      .sort((a, b) => new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime())
      .slice(0, 5);

    return { overdueTasks, dueSoonTasks };
  }, [tasks]);

  const analytics = useMemo(() => {
    const now = new Date();
    const periodStart =
      analyticsRange === 'month'
        ? new Date(now.getFullYear(), now.getMonth(), 1)
        : new Date(now.getTime() - (analyticsRange === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000);

    const totalLeads = leads.length;
    const leadsNouveau = leads.filter((lead) => lead.status === 'nouveau').length;
    const leadsEnCours = leads.filter((lead) => lead.status === 'en cours').length;
    const leadsConvertis = leads.filter((lead) => lead.status === 'converti').length;
    const leadsPerdus = leads.filter((lead) => lead.status === 'perdu').length;

    const conversionRate = totalLeads === 0 ? 0 : Math.round((leadsConvertis / totalLeads) * 100);
    const lostRate = totalLeads === 0 ? 0 : Math.round((leadsPerdus / totalLeads) * 100);

    const leadsCreatedInPeriod = leads.filter((lead) => {
      if (!lead.created_at) return false;
      return new Date(lead.created_at) >= periodStart;
    }).length;

    const overdueTasksCount = tasks
      .filter((task) => !task.is_completed && !!task.due_date)
      .filter((task) => new Date(task.due_date as string) < now).length;

    const commsInPeriod = communications.filter((communication) => {
      if (!communication.created_at) return false;
      return new Date(communication.created_at) >= periodStart;
    });

    const sentCount = commsInPeriod.filter((communication) => communication.status === 'sent').length;
    const failedCount = commsInPeriod.filter((communication) => communication.status === 'failed').length;
    const automationCount = commsInPeriod.filter((communication) => communication.trigger_type === 'automation').length;
    const deliveryRate = commsInPeriod.length === 0 ? 0 : Math.round((sentCount / commsInPeriod.length) * 100);

    const funnel = [
      { key: 'nouveau', label: 'Nouveau', count: leadsNouveau },
      { key: 'en-cours', label: 'En cours', count: leadsEnCours },
      { key: 'converti', label: 'Converti', count: leadsConvertis },
      { key: 'perdu', label: 'Perdu', count: leadsPerdus },
    ];

    const funnelMax = Math.max(...funnel.map((step) => step.count), 1);

    return {
      totalLeads,
      leadsNouveau,
      leadsEnCours,
      leadsConvertis,
      leadsPerdus,
      conversionRate,
      lostRate,
      leadsCreatedInPeriod,
      overdueTasksCount,
      commsInPeriodCount: commsInPeriod.length,
      sentCount,
      failedCount,
      automationCount,
      deliveryRate,
      funnel,
      funnelMax,
    };
  }, [leads, tasks, communications, analyticsRange]);

  const analyticsRangeLabel =
    analyticsRange === '7d' ? '7 derniers jours' : analyticsRange === '30d' ? '30 derniers jours' : 'Mois en cours';

  if (loading)
    return <div className="p-20 text-center font-black text-blue-600 animate-pulse">VÉRIFICATION DES ACCÈS...</div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12 font-sans">
      <header className="bg-white border-b-2 border-slate-200 p-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-black text-blue-700 italic tracking-tighter">CRM PRO - Accueil</h1>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {showRoleManager && role === 'admin' ? (
          <section className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-purple-200 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-purple-900 uppercase italic mb-8">Administration des Rôles</h2>
            <div className="grid gap-4">
              {allProfiles.map((u) => (
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
                <div className="flex justify-center mb-6"><ShieldAlert className="w-14 h-14 text-slate-500" /></div>
                <h2 className="text-3xl font-black mb-4 uppercase italic">Accès restreint</h2>
                <p className="text-slate-500 font-bold italic">Votre compte est en attente de validation. Contactez un Admin.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                {role === 'admin' && (
                  <section className="p-8 bg-gradient-to-br from-purple-900 to-indigo-800 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                    <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter">Console Admin</h2>
                    {adminMessage && <div className="mb-4 p-2 bg-white/20 rounded-lg text-xs font-bold border border-white/30 italic inline-flex items-center gap-2"><Megaphone className="w-4 h-4" />{adminMessage}</div>}
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => setShowRoleManager(true)} className="bg-white text-purple-900 px-7 py-3 rounded-2xl text-xs font-black uppercase shadow-2xl hover:scale-105 transition inline-flex items-center gap-2"><Settings className="w-4 h-4" />Gérer les membres</button>
                      <button
                        onClick={() => {
                          window.location.href = '/communications';
                        }}
                        className="bg-white/20 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase border border-white/40 hover:bg-white/30 transition"
                      >
                        Ouvrir Comms
                      </button>
                    </div>
                  </section>
                )}

                <section className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">Tableau de bord analytique</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                        Vue {role === 'admin' ? 'globale' : 'commerciale'}
                      </span>
                      <select
                        value={analyticsRange}
                        onChange={(e) => setAnalyticsRange(e.target.value as '7d' | '30d' | 'month')}
                        className="border border-slate-300 rounded-lg px-2 py-1 bg-white text-[11px] font-black uppercase"
                      >
                        <option value="7d">7j</option>
                        <option value="30d">30j</option>
                        <option value="month">Mois</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[10px] font-black uppercase text-slate-500">Leads totaux</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{analytics.totalLeads}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-[10px] font-black uppercase text-emerald-700">Taux conversion</p>
                      <p className="mt-2 text-2xl font-black text-emerald-800">{analytics.conversionRate}%</p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-[10px] font-black uppercase text-blue-700">CA pipeline</p>
                      <p className="mt-2 text-2xl font-black text-blue-800">{totalValue.toLocaleString()} €</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-[10px] font-black uppercase text-amber-700">Tâches en retard</p>
                      <p className="mt-2 text-2xl font-black text-amber-800">{analytics.overdueTasksCount}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-3">Funnel de conversion</p>
                      <div className="space-y-3">
                        {analytics.funnel.map((step) => {
                          const width = Math.max(8, Math.round((step.count / analytics.funnelMax) * 100));
                          return (
                            <div key={step.key}>
                              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                                <span>{step.label}</span>
                                <span>{step.count}</span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${width}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-3">Performance communications ({analyticsRangeLabel})</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <p className="text-[10px] font-black uppercase text-slate-500">Envoyés</p>
                          <p className="mt-1 text-xl font-black text-slate-900">{analytics.sentCount}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <p className="text-[10px] font-black uppercase text-slate-500">Échecs</p>
                          <p className="mt-1 text-xl font-black text-slate-900">{analytics.failedCount}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <p className="text-[10px] font-black uppercase text-slate-500">Auto-envois</p>
                          <p className="mt-1 text-xl font-black text-slate-900">{analytics.automationCount}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <p className="text-[10px] font-black uppercase text-slate-500">Taux délivrance</p>
                          <p className="mt-1 text-xl font-black text-slate-900">{analytics.deliveryRate}%</p>
                        </div>
                      </div>
                      <div className="mt-3 text-[11px] font-bold text-slate-500">
                        Leads créés ({analyticsRangeLabel}): {analytics.leadsCreatedInPeriod} • Taux perte: {analytics.lostRate}% • Communications: {analytics.commsInPeriodCount}
                      </div>
                    </div>
                  </div>
                </section>

                {role === 'commercial' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <section className="lg:col-span-7 bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                        <h3 className="text-xl font-black text-slate-800 uppercase italic">Mes tâches</h3>
                        <div className="flex gap-2">
                          <button onClick={() => setTaskView('today')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${taskView === 'today' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Aujourd'hui</button>
                          <button onClick={() => setTaskView('tomorrow')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${taskView === 'tomorrow' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Demain</button>
                          <button onClick={() => setTaskView('week')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${taskView === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Semaine</button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {filteredTasks.map((task) => (
                          <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-slate-900 text-sm">{task.title}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">{new Date(task.due_date as string).toLocaleString('fr-FR')}</p>
                                {(task.contact || task.lead) && (
                                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                                    {task.contact ? `Contact: ${task.contact.first_name || ''} ${task.contact.last_name || ''}` : ''}
                                    {task.contact && task.lead ? ' • ' : ''}
                                    {task.lead ? `Lead: ${task.lead.title || '-'}` : ''}
                                  </p>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${task.is_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {task.is_completed ? 'Terminée' : 'À faire'}
                              </span>
                            </div>
                          </div>
                        ))}

                        {filteredTasks.length === 0 && <p className="text-sm text-slate-500 italic">Aucune tâche sur cette période.</p>}
                      </div>

                      <div className="mt-5">
                        <button onClick={() => { window.location.href = '/tasks'; }} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase hover:bg-blue-700">Voir toutes les tâches</button>
                      </div>
                    </section>

                    <section className="lg:col-span-5 bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="text-xl font-black text-slate-800 uppercase italic">Leads chauds</h3>
                        <button onClick={() => { window.location.href = '/leads'; }} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase hover:bg-blue-700">Voir leads</button>
                      </div>

                      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-700">
                            Seuil : {hotLeadThreshold.toLocaleString()} €
                          </p>
                          <button
                            onClick={() => {
                              setHotLeadThresholdDraft(String(hotLeadThreshold));
                              setIsEditingHotLeadThreshold(true);
                            }}
                            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-400 transition"
                            title="Modifier le seuil"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>

                        {isEditingHotLeadThreshold && (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              step={500}
                              value={hotLeadThresholdDraft}
                              onChange={(e) => setHotLeadThresholdDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveHotLeadThreshold();
                                if (e.key === 'Escape') setIsEditingHotLeadThreshold(false);
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={saveHotLeadThreshold}
                              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-black uppercase hover:bg-blue-700"
                            >
                              OK
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {commercialLeadsChauds.map((lead) => (
                          <div key={lead.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-slate-900 text-sm">{lead.title || 'Lead sans titre'}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{lead.status}</p>
                              </div>
                              <span className="text-[11px] font-black text-blue-700">{Number(lead.estimated_value).toLocaleString()} €</span>
                            </div>
                          </div>
                        ))}
                        {commercialLeadsChauds.length === 0 && <p className="text-sm text-slate-500 italic">Aucun lead chaud à traiter pour un seuil de {hotLeadThreshold.toLocaleString()} €.</p>}
                      </div>
                    </section>

                    <section className="lg:col-span-12 bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6">
                      <h3 className="text-xl font-black text-slate-800 uppercase italic mb-5">Alertes & échéances</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                          <p className="text-[11px] font-black uppercase text-red-700 mb-3">Tâches en retard ({commercialAlerts.overdueTasks.length})</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {commercialAlerts.overdueTasks.map((task) => (
                              <div key={task.id} className="rounded-lg bg-white border border-red-100 p-3">
                                <p className="text-sm font-black text-slate-900">{task.title}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-1">{new Date(task.due_date as string).toLocaleString('fr-FR')}</p>
                              </div>
                            ))}
                            {commercialAlerts.overdueTasks.length === 0 && <p className="text-sm text-slate-500 italic">Aucune tâche en retard.</p>}
                          </div>
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-[11px] font-black uppercase text-amber-700 mb-3">À traiter sous 48h ({commercialAlerts.dueSoonTasks.length})</p>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {commercialAlerts.dueSoonTasks.map((task) => (
                              <div key={task.id} className="rounded-lg bg-white border border-amber-100 p-3">
                                <p className="text-sm font-black text-slate-900">{task.title}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-1">{new Date(task.due_date as string).toLocaleString('fr-FR')}</p>
                              </div>
                            ))}
                            {commercialAlerts.dueSoonTasks.length === 0 && <p className="text-sm text-slate-500 italic">Aucune échéance critique.</p>}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <section className="lg:col-span-5 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 h-fit">
                      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
                        <h2 className="text-xl font-black text-slate-800 uppercase italic">Répertoire ({visibleContacts.length})</h2>
                      </div>
                      <div className="mb-8">
                        <button onClick={() => { window.location.href = '/contacts'; }} className="px-3 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase hover:bg-blue-700">Plus de contacts</button>
                      </div>
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {previewContacts.map((c) => (
                          <div key={c.id} className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-blue-400 transition-all">
                            <div className="mb-4">
                              <p className="font-black text-slate-900">{c.first_name} {c.last_name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.email}</p>
                            </div>
                            <div className="pt-4 border-t border-slate-200">
                              <label className="text-[9px] font-black text-slate-400 uppercase block mb-2 italic">Commercial Assigné :</label>
                              {role === 'admin' ? (
                                <select value={c.assigned_to || 'none'} onChange={(e) => assignContact(c.id, e.target.value)} className="w-full bg-white border-2 border-slate-200 p-2.5 rounded-xl text-[10px] font-black focus:border-blue-500 outline-none cursor-pointer">
                                  <option value="none">-- Aucun --</option>
                                  {commercialsOnly.map((com) => (
                                    <option key={com.id} value={com.id}>{com.email}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-blue-700 text-[10px] font-black uppercase tracking-tighter">{c.assigned_commercial?.email || 'NON ASSIGNÉ'}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {previewContacts.length === 0 && <p className="text-sm text-slate-500 italic">Aucun contact visible pour votre profil.</p>}
                      </div>
                    </section>

                    <section className="lg:col-span-7 space-y-6">
                      <h2 className="text-2xl font-black text-slate-800 uppercase italic">Pipeline ({totalValue.toLocaleString()} €)</h2>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {['nouveau', 'en cours', 'converti', 'perdu'].map((st) => (
                          <div key={st} className="bg-slate-200/40 p-3 rounded-[1.5rem] border border-slate-200/50">
                            <h3 className="font-black text-slate-400 uppercase text-[8px] mb-4 text-center tracking-widest">{st}</h3>
                            <div className="space-y-3">
                              {leads.filter((l) => l.status === st).map((le) => (
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
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
