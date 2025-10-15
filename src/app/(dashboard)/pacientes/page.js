// file: src/app/(dashboard)/pacientes/page.js
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePatients } from '@/context/PatientContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
  import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, UserX } from 'lucide-react';

const PAGE_SIZE = 8;

const norm = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const digits = (s = '') => String(s).replace(/\D+/g, '');

//Mapa de colores por diagnóstico 
function dxBadgeClass(diagnostico = '') {
  const d = norm(diagnostico);

  // Reglas por palabra clave
  if (d.includes('diabetes')) {
    return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
  }
  if (d.includes('hipertension')) {
    return 'bg-rose-100 text-rose-700 hover:bg-rose-200';
  }
  if (d.includes('epoc')) {
    return 'bg-violet-100 text-violet-700 hover:bg-violet-200';
  }
  if (d.includes('asma')) {
    return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
  }

  // Default suave si no hay regla
  return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
}

function EstadoPill({ estado }) {
  const e = String(estado || '').toLowerCase();
  if (e === 'alerta') return <Badge variant="destructive">Alerta</Badge>;
  if (e === 'inactivo') return <Badge variant="outline">Inactivo</Badge>;
  return <Badge variant="secondary">Activo</Badge>;
}

export default function PacientesPage() {
  const { patients } = usePatients();

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const s = norm(q.trim());
    const d = digits(q);
    const list = !s && !d
      ? patients
      : patients.filter((p) => {
          const nombre = norm([p.nombre, p.apellidos].filter(Boolean).join(' '));
          const doc = digits(p.idNumber ?? p.documento ?? p.identificacion ?? p.id ?? '');
          return (s && nombre.includes(s)) || (d && doc.includes(d));
        });
    return list;
  }, [q, patients]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const clearAndReset = () => {
    setQ('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1>Lista de Pacientes</h1>
        <p className="text-sm text-muted-foreground">
          Busca por nombre o identificación. Click en el nombre para ver el detalle.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Búsqueda</CardTitle>
          <CardDescription>Filtra rápidamente por nombre o documento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre o identificación…"
              className="pl-9"
              aria-label="Buscar paciente por nombre o identificación"
            />
            {q && (
              <Button
                variant="outline"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                onClick={clearAndReset}
              >
                Limpiar
              </Button>
            )}
          </div>

          {/* Tabla o estado vacío */}
          {slice.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
              <UserX className="h-8 w-8 text-muted-foreground mb-2" />
              {filtered.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    No encontramos pacientes que coincidan con “{q}”.
                  </p>
                  <Button variant="outline" className="mt-3" onClick={clearAndReset}>
                    Limpiar filtro
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No hay pacientes para mostrar.</p>
              )}
            </div>
          ) : (
            <>
              <Table className="rounded-lg border">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead scope="col">Nombre</TableHead>
                    <TableHead scope="col">Identificación</TableHead>
                    <TableHead scope="col">EPS</TableHead>
                    <TableHead scope="col">Diagnóstico</TableHead>
                    <TableHead scope="col">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slice.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link href={`/pacientes/${p.id}`} className="text-primary hover:underline underline-offset-4">
                          {p.nombre}
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums">{p.idNumber}</TableCell>
                      <TableCell>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{p.eps}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={dxBadgeClass(p.diagnostico)}>{p.diagnostico}</Badge>
                      </TableCell>
                      <TableCell><EstadoPill estado={p.estado} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Mostrando {slice.length} de {filtered.length} pacientes
                </TableCaption>
              </Table>

              {/* Paginación */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Página {current} de {pageCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={current === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={current === pageCount}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
