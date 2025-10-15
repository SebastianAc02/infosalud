/// file: src/components/dashboard/Breadcrumbs.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS = {
  '': 'Dashboard',
  'pacientes': 'Pacientes',
  'seguimiento': 'Seguimiento',
  'asistencia': 'Asistencia',
  'registrar': 'Registrar',
  'reportes': 'Reportes',
  'settings': 'Configuración',
};

export default function Breadcrumbs() {
  const pathname = usePathname() || '/';
  const segments = pathname.split('/').filter(Boolean);

  const items = [
    { href: '/', label: LABELS[''] },
    ...segments.map((seg, idx) => {
      const href = '/' + segments.slice(0, idx + 1).join('/');
      const label = LABELS[seg] || capitalize(seg);
      return { href, label };
    })
  ];

  const last = items[items.length - 1]?.href;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = item.href === last;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-muted-foreground/70">/</span>}
              {isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-foreground hover:underline underline-offset-4">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function capitalize(s = '') {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
