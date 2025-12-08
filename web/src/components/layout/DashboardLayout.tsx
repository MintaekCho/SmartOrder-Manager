'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumb?: { name: string; href?: string }[];
}

export default function DashboardLayout({
  children,
  title,
  breadcrumb,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="ml-60 transition-all duration-300">
        <Header title={title} breadcrumb={breadcrumb} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
