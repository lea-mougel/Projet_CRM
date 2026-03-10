'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Search, CircleDollarSign, BarChart3, CheckCircle2, Sparkles, Settings2, ScanSearch, X } from 'lucide-react';
import { Lead } from '../api/contacts.api';
import { isOpenStage, isWonStage, normalizeLeadStatus } from '../lib/salesPipeline';

interface Commercial {
  id: string;
  email: string;
}

interface CommercialsListProps {
  commercials: Commercial[];
  leads: Lead[];
}

type SortField = 'email' | 'montantAttente' | 'conversion' | 'montantGagne';
type SortOrder = 'asc' | 'desc';

export default function CommercialsList({ commercials, leads }: CommercialsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('montantAttente');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Calculer les stats pour chaque commercial
  const commercialsWithStats = useMemo(() => {
    return commercials.map((commercial) => {
      const commercialLeads = leads.filter((l) => l.assigned_to === commercial.id);
      
      const nouveau = commercialLeads.filter((l) => normalizeLeadStatus(l.status) === 'Nouveau Lead').length;
      const enCours = commercialLeads.filter((l) => normalizeLeadStatus(l.status) === 'Decouverte des besoins (Audit)').length;
      const converti = commercialLeads.filter((l) => isWonStage(l.status)).length;
      
      const montantAttente = commercialLeads
        .filter((l) => isOpenStage(l.status))
        .reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
      
      const montantGagne = commercialLeads
        .filter((l) => isWonStage(l.status))
        .reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
      
      const conversion = nouveau > 0 ? (converti / nouveau) * 100 : 0;
      
      return {
        ...commercial,
        montantAttente,
        montantGagne,
        conversion,
        totalLeads: commercialLeads.length,
        leadCount: { nouveau, enCours, converti }
      };
    });
  }, [commercials, leads]);

  const filteredAndSorted = useMemo(() => {
    let filtered = commercialsWithStats.filter((commercial) =>
      commercial.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortField) {
        case 'email':
          compareValue = a.email.localeCompare(b.email);
          break;
        case 'montantAttente':
          compareValue = a.montantAttente - b.montantAttente;
          break;
        case 'montantGagne':
          compareValue = a.montantGagne - b.montantGagne;
          break;
        case 'conversion':
          compareValue = a.conversion - b.conversion;
          break;
      }
      
      return sortOrder === 'desc' ? -compareValue : compareValue;
    });

    return filtered;
  }, [commercialsWithStats, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestion des Commerciaux</h2>
        <p className="text-slate-600">{filteredAndSorted.length} commerciaux trouvés</p>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher un commercial par email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tableau des commerciaux */}
      {filteredAndSorted.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-4 px-6 font-bold text-slate-700">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-2 hover:text-blue-600 transition"
                  >
                    Commerciaux <SortIcon field="email" />
                  </button>
                </th>
                <th className="text-center py-4 px-6 font-bold text-slate-700">Total leads</th>
                <th className="text-center py-4 px-6 font-bold text-slate-700">
                  <button
                    onClick={() => handleSort('montantAttente')}
                    className="flex items-center justify-center gap-2 hover:text-blue-600 transition w-full"
                  >
                    <CircleDollarSign className="w-4 h-4" />Montant attente <SortIcon field="montantAttente" />
                  </button>
                </th>
                <th className="text-center py-4 px-6 font-bold text-slate-700">
                  <button
                    onClick={() => handleSort('conversion')}
                    className="flex items-center justify-center gap-2 hover:text-blue-600 transition w-full"
                  >
                    <BarChart3 className="w-4 h-4" />% Conversion <SortIcon field="conversion" />
                  </button>
                </th>
                <th className="text-center py-4 px-6 font-bold text-slate-700">
                  <button
                    onClick={() => handleSort('montantGagne')}
                    className="flex items-center justify-center gap-2 hover:text-blue-600 transition w-full"
                  >
                    <CheckCircle2 className="w-4 h-4" />Montant gagné <SortIcon field="montantGagne" />
                  </button>
                </th>
                <th className="text-center py-4 px-6 font-bold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((commercial, index) => (
                <tr
                  key={commercial.id}
                  className={`border-b border-slate-100 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } hover:bg-blue-50`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {commercial.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{commercial.email.split('@')[0]}</p>
                        <p className="text-xs text-slate-500">{commercial.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex gap-2 justify-center text-xs font-semibold">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3" />{commercial.leadCount.nouveau}</span>
                      </span>
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        <span className="inline-flex items-center gap-1"><Settings2 className="w-3 h-3" />{commercial.leadCount.enCours}</span>
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                        <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{commercial.leadCount.converti}</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center font-semibold text-slate-900">
                    {commercial.montantAttente.toLocaleString()} €
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-bold text-lg text-blue-600">
                          {commercial.conversion.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-500">
                          {commercial.leadCount.converti} / {commercial.leadCount.nouveau}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center font-semibold text-green-600">
                    {commercial.montantGagne.toLocaleString()} €
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Link
                      href={`/commercial/${commercial.id}`}
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Détails →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4"><ScanSearch className="w-12 h-12 text-slate-400" /></div>
          <p className="text-slate-600 font-semibold">Aucun commercial trouvé</p>
          <p className="text-slate-500 text-sm">Essayez de modifier votre recherche</p>
        </div>
      )}
    </div>
  );
}
