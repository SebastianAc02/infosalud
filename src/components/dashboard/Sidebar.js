// file: src/components/dashboard/Sidebar.js
'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutDashboard, Users, BarChart3, Settings, ClipboardPlus, CheckCheck } from 'lucide-react';

export function NavigationLinks({ isCollapsed }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Normaliza el rol (admin | auxiliar | medico)
  const rawRole = (session?.user?.role || '').toString().trim().toLowerCase();
  const userRole = rawRole === 'administrador' ? 'admin' : rawRole;

  // Si aún está cargando la sesión, se muestra skeletons para evitar “menú vacío”
  if (status === 'loading') {
    return (
      <nav className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-9 rounded-lg bg-muted animate-pulse"
            aria-hidden
          />
        ))}
      </nav>
    );
  }

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['medico', 'auxiliar', 'admin'] },
    { href: "/pacientes", label: "Pacientes", icon: Users, roles: ['medico', 'auxiliar', 'admin'] },
    // Médico y Admin pueden registrar asistencia
    { href: "/seguimiento/asistencia", label: "Registrar asistencia", icon: CheckCheck, roles: ['medico', 'admin'] },
    // Todos pueden registrar seguimiento
    { href: "/seguimiento/registrar", label: "Registrar seguimiento", icon: ClipboardPlus, roles: ['auxiliar', 'medico', 'admin'] },
    // Reportes: Médico y Admin
    { href: "/reportes", label: "Reportes", icon: BarChart3, roles: ['medico', 'admin'] },
    // Configuración: todos (el Admin verá más dentro)
    { href: "/settings", label: "Configuración", icon: Settings, roles: ['medico', 'auxiliar', 'admin'] },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          if (!userRole || !link.roles.includes(userRole)) return null;
          const isActive = (link.href === '/') ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Tooltip key={link.label}>
              <TooltipTrigger asChild>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}
                >
                  <link.icon className="h-5 w-5" />
                  {!isCollapsed && <span className="whitespace-nowrap">{link.label}</span>}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>{link.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
