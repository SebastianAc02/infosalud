// file: src/app/(dashboard)/reportes/resumen/page.js
'use client';

import { useMemo, useState } from 'react';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption
} from '@/components/ui/table';
import { usePatients } from '@/context/PatientContext';
import { Calendar as CalendarIcon, Download, Printer } from 'lucide-react';

function toMonthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function parseMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1);
}
function inMonth(date, monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  return date >= first && date <= last;
}
function csvDownload(filename, rows) {
  const csv = rows.map(r => r.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportesResumenPage() {
  const { patients } = usePatients();

  // Mes seleccionado (YYYY-MM)
  const now = new Date();
  const [month, setMonth] = useState(toMonthKey(now));

  const monthDate = useMemo(() => parseMonthKey(month), [month]);
  const monthLabel = useMemo(
    () => monthDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }),
    [monthDate]
  );

  // Agregados del mes 
  const {
    asistidas, perdidas, proximas, adherenciaProm,
    dxDistrib, epsDistrib, noShows, seguimientosMes
  } = useMemo(() => {
    let asistidas = 0;
    let perdidas = 0;
    let proximas = 0;
    let adhSum = 0;
    let adhCnt = 0;

    const dxCount = new Map();
    const epsCount = new Map();
    const noShows = [];
    const seguimientosMes = [];

    for (const p of patients) {
      // Citas pasadas
      for (const c of p.citasPasadas || []) {
        const d = new Date(c.fecha);
        if (!isFinite(d)) continue;
        if (inMonth(d, monthDate)) {
          if (c.estado === 'asistida') asistidas++;
          else {
            perdidas++;
            noShows.push({
              fecha: c.fecha,
              paciente: p.nombre,
              idNumber: p.idNumber,
              eps: p.eps,
              diagnostico: p.diagnostico,
            });
          }
        }
      }
      // Próximas citas dentro del mes
      if (p.proximaCita) {
        const d = new Date(p.proximaCita);
        if (isFinite(d) && inMonth(d, monthDate)) proximas++;
      }
      // Seguimientos/adherencia dentro del mes
      for (const h of p.historial || []) {
        if (!h.fecha) continue;
        const d = new Date(h.fecha);
        if (isFinite(d) && inMonth(d, monthDate)) {
          if (typeof h.adherenciaPorcentaje === 'number') {
            adhSum += h.adherenciaPorcentaje;
            adhCnt++;
          }
          seguimientosMes.push({
            fecha: h.fecha,
            paciente: p.nombre,
            idNumber: p.idNumber,
            adherencia: typeof h.adherenciaPorcentaje === 'number' ? h.adherenciaPorcentaje : null,
            notas: h.notas || '',
            alerta: !!h.generarAlerta,
          });
        }
      }
      // Distribuciones (sobre pacientes con algún evento/cita en el mes o todos)
      if (p.diagnostico) dxCount.set(p.diagnostico, (dxCount.get(p.diagnostico) || 0) + 1);
      if (p.eps) epsCount.set(p.eps, (epsCount.get(p.eps) || 0) + 1);
    }

    const adherenciaProm = adhCnt ? Math.round(adhSum / adhCnt) : 0;

    const dxDistrib = Array.from(dxCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const epsDistrib = Array.from(epsCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    noShows.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    seguimientosMes.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

    return {
      asistidas, perdidas, proximas, adherenciaProm,
      dxDistrib, epsDistrib, noShows, seguimientosMes
    };
  }, [patients, monthDate]);

  // Exportaciones 
  const exportResumenCSV = () => {
    const rows = [
      ['Mes', monthLabel],
      ['Citas asistidas', asistidas],
      ['Citas no asistidas', perdidas],
      ['Próximas citas', proximas],
      ['Adherencia promedio (%)', adherenciaProm],
    ];
    csvDownload(`resumen_${month}.csv`, rows);
  };

  const exportNoShowsCSV = () => {
    const header = ['Fecha', 'Paciente', 'Identificación', 'EPS', 'Diagnóstico'];
    const rows = [header, ...noShows.map(r => [r.fecha, r.paciente, r.idNumber, r.eps, r.diagnostico])];
    csvDownload(`no_asistidas_${month}.csv`, rows);
  };

  const exportSeguimientosCSV = () => {
    const header = ['Fecha', 'Paciente', 'Identificación', 'Adherencia (%)', 'Alerta', 'Notas'];
    const rows = [header, ...seguimientosMes.map(r => [
      r.fecha, r.paciente, r.idNumber, r.adherencia ?? '', r.alerta ? 'Sí' : 'No', r.notas
    ])];
    csvDownload(`seguimientos_${month}.csv`, rows);
  };

  const printPDF = () => window.print();

  return (
    <div className="space-y-6">
      {/* Encabezado (no aparece al imprimir) */}
      <div className="flex items-start justify-between gap-3 print:hidden">
        <div>
          <h1>Resumen mensual</h1>
          <p className="text-sm text-muted-foreground">
            Selecciona un mes y exporta/imprime el resumen de seguimiento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Input de mes con ícono centrado */}
          <div className="relative">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="pe-10"
              aria-label="Seleccionar mes"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </span>
          </div>

          <Button variant="outline" onClick={exportResumenCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={printPDF}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen de {monthLabel}</CardTitle>
          <CardDescription>Indicadores clave del mes seleccionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Citas asistidas</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{asistidas}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Citas no asistidas</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{perdidas}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Próximas citas</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{proximas}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Adherencia promedio</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{adherenciaProm}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuciones */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por diagnóstico</CardTitle>
            <CardDescription>Pacientes por condición</CardDescription>
          </CardHeader>
          <CardContent>
            {dxDistrib.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>
            ) : (
              <Table className="rounded-lg border">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Diagnóstico</TableHead>
                    <TableHead className="text-right">Pacientes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dxDistrib.map((d, i) => (
                    <TableRow key={`${d.name}-${i}`}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>Total diagnósticos: {dxDistrib.length}</TableCaption>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por EPS</CardTitle>
            <CardDescription>Pacientes por aseguradora</CardDescription>
          </CardHeader>
          <CardContent>
            {epsDistrib.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>
            ) : (
              <Table className="rounded-lg border">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>EPS</TableHead>
                    <TableHead className="text-right">Pacientes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {epsDistrib.map((e, i) => (
                    <TableRow key={`${e.name}-${i}`}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{e.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>Total EPS: {epsDistrib.length}</TableCaption>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* No asistencias del mes */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">No asistencias del mes</CardTitle>
            <CardDescription>Listado de citas perdidas en {monthLabel}.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportNoShowsCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </CardHeader>
        <CardContent>
          {noShows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se registraron inasistencias.</p>
          ) : (
            <Table className="rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Identificación</TableHead>
                  <TableHead>EPS</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {noShows.map((r, i) => (
                  <TableRow key={`${r.idNumber}-${r.fecha}-${i}`}>
                    <TableCell className="tabular-nums">{r.fecha}</TableCell>
                    <TableCell className="font-medium">{r.paciente}</TableCell>
                    <TableCell className="tabular-nums">{r.idNumber}</TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{r.eps}</Badge>
                    </TableCell>
                    <TableCell>{r.diagnostico}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Total no asistencias: {noShows.length}</TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Seguimientos del mes */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Seguimientos del mes</CardTitle>
            <CardDescription>Adherencia y notas registradas en {monthLabel}.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportSeguimientosCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </CardHeader>
        <CardContent>
          {seguimientosMes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay seguimientos registrados en este mes.</p>
          ) : (
            <Table className="rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Identificación</TableHead>
                  <TableHead>Adherencia</TableHead>
                  <TableHead>Alerta</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seguimientosMes.map((r, i) => (
                  <TableRow key={`${r.idNumber}-${r.fecha}-${i}`}>
                    <TableCell className="tabular-nums">{r.fecha}</TableCell>
                    <TableCell className="font-medium">{r.paciente}</TableCell>
                    <TableCell className="tabular-nums">{r.idNumber}</TableCell>
                    <TableCell className="tabular-nums">{r.adherencia == null ? '—' : `${r.adherencia}%`}</TableCell>
                    <TableCell>
                      {r.alerta ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Alerta</Badge>
                      ) : (
                        <Badge variant="secondary">—</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[420px]">
                      <span className="line-clamp-2">{r.notas}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Total seguimientos: {seguimientosMes.length}</TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pie de impresión */}
      <div className="print:block hidden mt-8">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Elaborado por:</p>
            <div className="mt-4 h-10 border-b" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Aprobado por:</p>
            <div className="mt-4 h-10 border-b" />
          </div>
        </div>
      </div>
    </div>
  );
}
