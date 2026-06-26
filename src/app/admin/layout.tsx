'use client';

import * as React from 'react';
import { SiteHeader } from '@/components/layout/header';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex flex-col">{children}</main>
    </>
  );
}
