// file: src/app/(dashboard)/layout.js
'use client';

import { useState } from 'react';
import { PatientProvider } from '@/context/PatientContext';
import { Toaster } from 'react-hot-toast';
import { NavigationLinks } from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleSidebar = () => setIsCollapsed((v) => !v);

  return (
    <PatientProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        {/* Sidebar (escritorio) */}
        <aside
          className={`fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300 ${
            isCollapsed ? 'w-20' : 'w-64'
          } print:hidden`}
        >
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold font-heading whitespace-nowrap"
            >
              <span className="text-lg">{isCollapsed ? 'IS' : 'InfoSalud 🩺'}</span>
            </Link>
          </div>

          <div className="flex-1 overflow-auto py-4 px-2">
            <NavigationLinks isCollapsed={isCollapsed} />
          </div>

          <div className="mt-auto p-4 border-t">
            <Button onClick={toggleSidebar} variant="outline" size="icon" className="w-full">
              {isCollapsed ? (
                <ArrowRightToLine className="h-5 w-5" />
              ) : (
                <ArrowLeftToLine className="h-5 w-5" />
              )}
            </Button>
          </div>
        </aside>

        {/* Contenido + header */}
        <div
          className={`flex flex-col sm:gap-4 sm:py-4 transition-all duration-300 ${
            isCollapsed ? 'sm:pl-20' : 'sm:pl-64'
          } print:pl-0 print:py-0`}
        >
          <Header />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 print:p-0">
            {children}
          </main>
        </div>

        <Toaster position="top-center" />
      </div>
    </PatientProvider>
  );
}
