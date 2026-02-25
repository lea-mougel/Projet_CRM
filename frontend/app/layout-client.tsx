'use client';

import { usePathname } from 'next/navigation';
import SideNavigation from '../components/SideNavigation';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Pages sans sidebar (login, signup)
  const hideSidebarPages = ['/login', '/signup'];
  const showSidebar = !hideSidebarPages.includes(pathname);

  return (
    <div className={showSidebar ? 'pl-20' : ''}>
      {showSidebar && <SideNavigation />}
      {children}
    </div>
  );
}
