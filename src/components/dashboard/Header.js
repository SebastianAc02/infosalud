// file: src/components/dashboard/Header.js
'use client';

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, ChevronDown, ChevronRight, Home } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { NavigationLinks } from "./Sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePatients } from "@/context/PatientContext";

// Mapa de etiquetas legibles
const LABELS = {
  "": "Dashboard",
  "pacientes": "Pacientes",
  "seguimiento": "Seguimiento",
  "asistencia": "Registrar asistencia",
  "registrar": "Registrar seguimiento",
  "reportes": "Reportes",
  "resumen": "Resumen mensual",
  "settings": "Configuración",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const { patients } = usePatients();

  // Normaliza y separa segmentos
  const segments = (pathname || "/")
    .split("/")
    .filter(Boolean);

  // Base del breadcrumb siempre enlaza al dashboard
  const crumbs = [
    { href: "/", label: LABELS[""], icon: Home }
  ];

  // Construye rutas acumulando segmentos
  let hrefAcc = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    hrefAcc += `/${seg}`;

    // Caso especial: /pacientes/[id]
    if (i > 0 && segments[i - 1] === "pacientes") {
      const patient = patients?.find(p => p.id === seg);
      crumbs.push({
        href: hrefAcc,
        label: patient?.nombre || "Detalle",
      });
      continue;
    }

    // Etiqueta por defecto del segmento
    const label = LABELS[seg] || seg;
    crumbs.push({ href: hrefAcc, label });
  }

  return crumbs;
}

export default function Header() {
  const { data: session } = useSession();
  const crumbs = useBreadcrumbs();

  // Deriva nombre y rol (solo esto, como pediste)
  const displayName = session?.user?.name || "Usuario";
  const displayRole = session?.user?.role ? ` · ${session.user.role}` : "";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 lg:h-[60px]">
      {/* Menú lateral (mobile) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold font-heading">
              <span className="text-lg">InfoSalud 🩺</span>
            </Link>
          </div>
          <div className="overflow-auto py-4 px-2">
            <NavigationLinks isCollapsed={false} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Breadcrumb (contexto de ubicación) */}
      <div className="hidden md:flex min-w-0 flex-col">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground truncate">
          <ol className="flex items-center gap-1">
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              const Icon = c.icon;
              return (
                <li key={`${c.href}-${i}`} className="flex items-center">
                  {i > 0 && (
                    <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                  {isLast ? (
                    <span className="text-foreground truncate">{c.label}</span>
                  ) : (
                    <Link
                      href={c.href}
                      className="hover:text-foreground inline-flex items-center gap-1"
                    >
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      <span className="truncate">{c.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Menú de usuario (derecha) */}
      <div className="relative ml-auto flex-1 md:grow-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <span className="truncate">{displayName}{displayRole}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

