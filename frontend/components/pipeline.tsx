'use client';
import { useState, useEffect } from 'react';

interface Lead {
  id: string;
  title: string;
  amount: number;
  status: 'nouveau' | 'en_cours' | 'gagné' | 'perdu';
  contacts: { first_name: string, last_name: string };
}

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statuses = [
    { id: 'nouveau', label: 'Nouveau', color: 'bg-blue-500' },
    { id: 'en_cours', label: 'En Cours', color: 'bg-yellow-500' },
    { id: 'gagné', label: 'Gagné', color: 'bg-green-500' },
    { id: 'perdu', label: 'Perdu', color: 'bg-red-500' }
  ];

  const totalAmount = leads.reduce((acc, lead) => acc + (Number(lead.amount) || 0), 0);

  if (loading) return <p className="text-slate-400 animate-pulse font-bold">Chargement de la pipeline...</p>;

  return (
    <section className="mt-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wide">Pipeline de Vente</h2>
          <p className="text-slate-500 font-bold">Valeur totale : {totalAmount.toLocaleString()} €</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase shadow-lg hover:bg-blue-700">
          + Nouveau Lead
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statuses.map(status => (
          <div key={status.id} className="bg-slate-200/50 p-4 rounded-2xl border-2 border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
              <h3 className="font-black text-slate-700 uppercase text-sm">{status.label}</h3>
              <span className="ml-auto bg-slate-300 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                {leads.filter(l => l.status === status.id).length}
              </span>
            </div>

            <div className="space-y-3">
              {leads.filter(l => l.status === status.id).map(lead => (
                <div key={lead.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer">
                  <p className="font-bold text-slate-900 leading-tight mb-1">{lead.title}</p>
                  <p className="text-xs text-slate-500 mb-2">{lead.contacts?.first_name} {lead.contacts?.last_name}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700 font-black text-sm">{lead.amount} €</span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}