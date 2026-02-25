'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyContactsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/contacts?tab=my');
  }, [router]);

  return <div className="p-10 text-center text-slate-500">Redirection vers Contacts...</div>;
}
