'use client';

import Link from 'next/link';

type TabKey = 'home' | 'my-contacts' | 'contacts' | 'companies';

type TopNavigationProps = {
  active: TabKey;
};

const tabs: Array<{ key: TabKey; label: string; href: string }> = [
  { key: 'home', label: 'Accueil', href: '/' },
  { key: 'my-contacts', label: 'Mes contacts', href: '/my-contacts' },
  { key: 'contacts', label: 'Contacts', href: '/contacts' },
  { key: 'companies', label: 'Entreprises', href: '/companies' },
];

export default function TopNavigation({ active }: TopNavigationProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`px-3 py-2 rounded border text-sm ${
            tab.key === active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
