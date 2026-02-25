'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

type NavItem = {
  href: string;
  icon: string;
  label: string;
  key: string;
};

const navItems: NavItem[] = [
  { href: '/', icon: '🏠', label: 'Accueil', key: 'home' },
  { href: '/my-contacts', icon: '👤', label: 'Mes contacts', key: 'my-contacts' },
  { href: '/contacts', icon: '👥', label: 'Contacts', key: 'contacts' },
  { href: '/companies', icon: '🏢', label: 'Entreprises', key: 'companies' },
  { href: '/leads', icon: '📊', label: 'Leads', key: 'leads' },
];

export default function SideNavigation() {
  const pathname = usePathname();
  const router = useRouter();
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

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/login';
  }, [supabase.auth]);

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-white border-r-2 border-slate-200 shadow-sm flex flex-col items-center py-6 z-40">
      {/* Logo/App Name */}
      <div className="mb-8 flex items-center justify-center">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
          C
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-6">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="relative group flex items-center justify-center w-12 h-12 rounded-lg transition-all"
            title={item.label}
          >
            {/* Icon */}
            <span
              className={`text-2xl transition-all ${
                isActive(item.href) ? 'scale-110' : 'scale-100 group-hover:scale-110'
              }`}
            >
              {item.icon}
            </span>

            {/* Tooltip/Label on hover */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {item.label}
              {/* Arrow pointing left */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-900"></div>
            </div>

            {/* Active indicator */}
            {isActive(item.href) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-lg"></div>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="relative group flex items-center justify-center w-12 h-12 rounded-lg transition-all hover:bg-red-50 mb-4"
        title="Déconnexion"
      >
        <span className="text-2xl transition-all group-hover:scale-110">🚪</span>

        {/* Tooltip */}
        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Déconnexion
          {/* Arrow pointing left */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-900"></div>
        </div>
      </button>
    </aside>
  );
}
