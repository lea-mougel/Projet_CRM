'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { contactsApi, Contact, Lead, Task } from '../../api/contacts.api';

type CurrentUser = {
  id: string;
  role: string;
};

export default function TasksPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [createForm, setCreateForm] = useState({
    title: '',
    due_date: '',
    contact_id: '',
    lead_id: '',
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

  const loadTasks = useCallback(async () => {
    try {
      const data = await contactsApi.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
      setTasks([]);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      const data = await contactsApi.getAll('', true);
      setContacts(data);
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
      setContacts([]);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      const data = await contactsApi.getAllLeads();
      setLeads(data);
    } catch (error) {
      console.error('Erreur chargement leads:', error);
      setLeads([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const profile = await contactsApi.getUserProfile(session.user.id);
      const role = profile?.role || 'user';
      setCurrentUser({ id: session.user.id, role });
      setLoading(false);
    };

    void init();
  }, [router, supabase]);

  useEffect(() => {
    if (!loading) {
      void loadTasks();
      void loadContacts();
      void loadLeads();
    }
  }, [loading, loadTasks, loadContacts, loadLeads]);

  const filteredTasks = useMemo(() => {
    if (filter === 'todo') return tasks.filter((task) => !task.is_completed);
    if (filter === 'done') return tasks.filter((task) => task.is_completed);
    return tasks;
  }, [tasks, filter]);

  const handleCreateTask = async () => {
    if (!createForm.title.trim()) {
      alert('Le titre est obligatoire');
      return;
    }

    try {
      await contactsApi.createTask({
        title: createForm.title.trim(),
        due_date: createForm.due_date || undefined,
        contact_id: createForm.contact_id || undefined,
        lead_id: createForm.lead_id || undefined,
      });

      setCreateForm({ title: '', due_date: '', contact_id: '', lead_id: '' });
      setShowCreateForm(false);
      await loadTasks();
    } catch (error) {
      console.error('Erreur création tâche:', error);
      alert('Impossible de créer la tâche');
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await contactsApi.updateTask(task.id, { is_completed: !task.is_completed });
      await loadTasks();
    } catch (error) {
      console.error('Erreur mise à jour tâche:', error);
      alert('Impossible de mettre à jour la tâche');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = window.confirm('Supprimer cette tâche ?');
    if (!confirmed) return;

    try {
      await contactsApi.deleteTask(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Erreur suppression tâche:', error);
      alert('Impossible de supprimer la tâche');
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Chargement des tâches...</div>;
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
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-blue-700 italic tracking-tighter">Tâches</h1>
            <p className="text-slate-500 font-semibold text-sm">Gestion des rappels, appels et RDV</p>
          </div>
          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            {showCreateForm ? 'Fermer' : '+ Nouvelle tâche'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Créer une tâche</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Titre de la tâche"
                value={createForm.title}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="datetime-local"
                value={createForm.due_date}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, due_date: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              />
              <select
                value={createForm.contact_id}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, contact_id: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Aucun contact lié</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} ({contact.email})
                  </option>
                ))}
              </select>
              <select
                value={createForm.lead_id}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, lead_id: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Aucun lead lié</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.title} ({lead.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4">
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-4 border border-slate-200 flex gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Toutes ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('todo')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === 'todo' ? 'bg-yellow-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            À faire ({tasks.filter((task) => !task.is_completed).length})
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === 'done' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Terminées ({tasks.filter((task) => task.is_completed).length})
          </button>
        </div>

        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Statut</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Titre</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Échéance</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Contact lié</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Lead lié</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={task.is_completed}
                        onChange={() => handleToggleTask(task)}
                      />
                      <span className={task.is_completed ? 'text-green-600 font-semibold' : 'text-yellow-700 font-semibold'}>
                        {task.is_completed ? 'Terminée' : 'À faire'}
                      </span>
                    </label>
                  </td>
                  <td className={`py-3 px-4 font-semibold ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                    {task.title}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {task.due_date ? new Date(task.due_date).toLocaleString('fr-FR') : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {task.contact
                      ? `${task.contact.first_name} ${task.contact.last_name}`
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {task.lead ? `${task.lead.title} (${task.lead.status})` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Aucune tâche pour ce filtre.
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
