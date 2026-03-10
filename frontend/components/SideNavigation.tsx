'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Home,
  Users,
  Building2,
  BarChart3,
  CheckSquare,
  Mail,
  TrendingUp,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { contactsApi } from '../api/contacts.api';

type NavItem = {
  href: string;
  icon: 'home' | 'contacts' | 'companies' | 'leads' | 'tasks' | 'communications' | 'pipeline' | 'commercials';
  label: string;
  key: string;
};

const baseNavItems: NavItem[] = [
  { href: '/', icon: 'home', label: 'Accueil', key: 'home' },
  { href: '/contacts?tab=my', icon: 'contacts', label: 'Contacts', key: 'contacts' },
  { href: '/companies', icon: 'companies', label: 'Entreprises', key: 'companies' },
  { href: '/leads', icon: 'leads', label: 'Leads', key: 'leads' },
  { href: '/tasks', icon: 'tasks', label: 'Tâches', key: 'tasks' },
  { href: '/communications', icon: 'communications', label: 'Comms', key: 'communications' },
  { href: '/pipeline', icon: 'pipeline', label: 'Pipeline', key: 'pipeline' },
];

const adminNavItems: NavItem[] = [
  { href: '/commercials', icon: 'commercials', label: 'Commerciaux', key: 'commercials' },
];

export default function SideNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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
    const checkRole = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) {
          setLoading(false);
          return;
        }

        try {
          // Timeout: ne pas attendre plus de 3s pour le profil
          const profilePromise = contactsApi.getUserProfile(data.session.user.id);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );
          const profile = await Promise.race([profilePromise, timeoutPromise]) as { role: string };
          if (profile && profile.role === 'admin') {
            setIsAdmin(true);
          }
        } catch (err) {
          // Continuer même si le profil ne charge pas
          console.error('Erreur profil (non-critique):', err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [supabase]);

  const navItems = useMemo(() => {
    let items = [...baseNavItems];
    // Masquer /leads pour les admins
    if (isAdmin) {
      items = items.filter((item) => item.key !== 'leads');
      items.push(...adminNavItems);
    }
    return items;
  }, [isAdmin]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/login';
  }, [supabase.auth]);

  const isActive = (href: string) => {
    const cleanHref = href.split('?')[0];
    if (cleanHref === '/' && pathname === '/') return true;
    if (cleanHref !== '/' && pathname.startsWith(cleanHref)) return true;
    return false;
  };

  const renderIcon = (icon: NavItem['icon']) => {
    const className = 'w-6 h-6';

    switch (icon) {
      case 'home':
        return <Home className={className} />;
      case 'contacts':
        return <Users className={className} />;
      case 'companies':
        return <Building2 className={className} />;
      case 'leads':
        return <BarChart3 className={className} />;
      case 'tasks':
        return <CheckSquare className={className} />;
      case 'communications':
        return <Mail className={className} />;
      case 'pipeline':
        return <TrendingUp className={className} />;
      case 'commercials':
        return <Briefcase className={className} />;
      default:
        return <Home className={className} />;
    }
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
              {renderIcon(item.icon)}
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
        <span className="text-2xl transition-all group-hover:scale-110">
          <LogOut className="w-6 h-6" />
        </span>

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
