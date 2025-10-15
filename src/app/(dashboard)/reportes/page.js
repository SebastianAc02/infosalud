// file: src/app/(dashboard)/reportes/page.js
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePatients } from '@/context/PatientContext';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3, Download } from 'lucide-react';

// helpers
const toDate = (s) => (s ? new Date(s) : null);
const fmtYYYYMM = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const within = (d, start, end) => d && d >= start && d <= end;

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function monthRange(start, end) {
  const out = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    out.push(fmtYYYYMM(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

// Paleta de charts 
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function ReportesPage() {
  const { patients } = usePatients();

  // Filtros
  const [epsFilter, setEpsFilter] = useState('all');
  const [dxFilter, setDxFilter] = useState('all');
  const [sedeFilter, setSedeFilter] = useState('all');
  const [medicoFilter, setMedicoFilter] = useState('all');
  const [range, setRange] = useState('6m'); // 3m | 6m | 12m

  // Toggle “Solo no asistidas”
  const [onlyNoShows, setOnlyNoShows] = useState(false);

  const now = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const months = range === '12m' ? -12 : range === '6m' ? -6 : -3;
    return addMonths(now, months);
  }, [now, range]);

  // Catálogos
  const epsOptions = useMemo(
    () => ['all', ...Array.from(new Set(patients.map(p => p.eps).filter(Boolean)))],
    [patients]
  );
  const dxOptions = useMemo(
    () => ['all', ...Array.from(new Set(patients.map(p => p.diagnostico).filter(Boolean)))],
    [patients]
  );
  const sedeOptions = useMemo(
    () => ['all', ...Array.from(new Set(patients.map(p => p.sede).filter(Boolean)))],
    [patients]
  );
  const medicoOptions = useMemo(
    () => ['all', ...Array.from(new Set(patients.map(p => p.medicoAsignado).filter(Boolean)))],
    [patients]
  );

  // Dataset filtrado
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const epsOk = epsFilter === 'all' || p.eps === epsFilter;
      const dxOk = dxFilter === 'all' || p.diagnostico === dxFilter;
      const sedeOk = sedeFilter === 'all' || p.sede === sedeFilter;
      const medOk = medicoFilter === 'all' || p.medicoAsignado === medicoFilter;
      return epsOk && dxOk && sedeOk && medOk;
    });
  }, [patients, epsFilter, dxFilter, sedeFilter, medicoFilter]);

  // Agregados (con adherencia)
  const {
    kpis, monthlySeries, topDx, epsDistrib, citasTable, confPorSede, adhSeries
  } = useMemo(() => {
    const end = now;
    const monthsList = monthRange(startDate, end);

    let totalAsistidas = 0;
    let totalPerdidas = 0;
    let proximas = 0;
    let alertas = 0;
    let activos = 0;

    // Adherencia global y mensual
    let adhSum = 0;
    let adhCnt = 0;
    const byMonth = new Map(monthsList.map((m) => [m, { month: m, asistidas: 0, perdidas: 0 }]));
    const adhByMonth = new Map(monthsList.map((m) => [m, { month: m, sum: 0, count: 0 }]));

    const dxCount = new Map();
    const epsCount = new Map();
    const citasRows = [];
    const sedeConfirm = new Map();

    for (const p of filteredPatients) {
      if (p.estado === 'alerta') alertas++;
      if (p.estado !== 'inactivo') activos++;

      const pc = toDate(p.proximaCita);
      if (pc && within(pc, startDate, end)) proximas++;

      if (p.diagnostico) dxCount.set(p.diagnostico, (dxCount.get(p.diagnostico) || 0) + 1);
      if (p.eps) epsCount.set(p.eps, (epsCount.get(p.eps) || 0) + 1);

      if (p.sede && p.proximaCita) {
        const row = sedeConfirm.get(p.sede) || { confirmadas: 0, total: 0 };
        row.total += 1;
        if (p.proximaCitaEstado === 'confirmada') row.confirmadas += 1;
        sedeConfirm.set(p.sede, row);
      }

      // Citas pasadas (para series de asistencia)
      for (const c of p.citasPasadas || []) {
        const d = toDate(c.fecha);
        if (!d || !within(d, startDate, end)) continue;
        const mk = fmtYYYYMM(new Date(d.getFullYear(), d.getMonth(), 1));
        const bucket = byMonth.get(mk);
        if (bucket) {
          if (c.estado === 'asistida') { bucket.asistidas += 1; totalAsistidas++; }
          else { bucket.perdidas += 1; totalPerdidas++; }
        }
        citasRows.push({ paciente: p.nombre, idNumber: p.idNumber, fecha: c.fecha, estado: c.estado, eps: p.eps, diagnostico: p.diagnostico });
      }

      // Historial (para adherencia)
      for (const h of p.historial || []) {
        const d = toDate(h.fecha);
        if (!d || !within(d, startDate, end)) continue;
        if (typeof h.adherenciaPorcentaje === 'number') {
          adhSum += h.adherenciaPorcentaje;
          adhCnt += 1;
          const mk = fmtYYYYMM(new Date(d.getFullYear(), d.getMonth(), 1));
          const ab = adhByMonth.get(mk);
          if (ab) { ab.sum += h.adherenciaPorcentaje; ab.count += 1; }
        }
      }
    }

    const asistenciaPct = (totalAsistidas + totalPerdidas) > 0
      ? Math.round((totalAsistidas / (totalAsistidas + totalPerdidas)) * 100)
      : 0;

    const monthlySeries = Array.from(byMonth.values());

    const topDx = Array.from(dxCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const epsDistrib = Array.from(epsCount.entries())
      .map(([name, count]) => ({ name, value: count }));

    citasRows.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

    const confPorSede = Array.from(sedeConfirm.entries()).map(([sede, obj]) => ({
      sede,
      confirmadas: obj.confirmadas,
      total: obj.total,
      porcentaje: obj.total ? Math.round((obj.confirmadas / obj.total) * 100) : 0,
    }));

    const adhSeries = Array.from(adhByMonth.values()).map(({ month, sum, count }) => ({
      month,
      promedio: count ? Math.round(sum / count) : null,
    }));
    const adherenciaProm = adhCnt ? Math.round(adhSum / adhCnt) : 0;

    const kpis = {
      activos,
      asistenciaPct,
      perdidas: totalPerdidas,
      proximas,
      alertas,
      totalEventos: totalAsistidas + totalPerdidas,
      adherenciaProm,
    };

    return { kpis, monthlySeries, topDx, epsDistrib, citasTable: citasRows, confPorSede, adhSeries };
  }, [filteredPatients, startDate, now]);

  // Serie para el chart principal
  const displayMonthlySeries = useMemo(() => {
    if (!onlyNoShows) return monthlySeries;
    return monthlySeries.map((m) => ({ ...m, asistidas: 0 }));
  }, [monthlySeries, onlyNoShows]);

  // Tabla visible y CSV en función del toggle
  const visibleEvents = useMemo(() => {
    return onlyNoShows ? citasTable.filter(r => r.estado !== 'asistida') : citasTable;
  }, [citasTable, onlyNoShows]);

  const exportCSV = () => {
    const header = ['Fecha', 'Paciente', 'Identificación', 'Estado', 'EPS', 'Diagnóstico'];
    const rows = visibleEvents.map((r) => [r.fecha, r.paciente, r.idNumber, r.estado, r.eps, r.diagnostico]);
    const csv = [header, ...rows].map((cols) =>
      cols.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reportes_citas_${onlyNoShows ? 'no_asistidas_' : ''}${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pieColors = (i) => CHART_COLORS[i % CHART_COLORS.length];

  return (
    <div className="space-y-6">
      {/* Encabezado + acceso al resumen mensual */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1>Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Análisis con filtros y exportación de datos.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/reportes/resumen">Resumen mensual (PDF)</Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
          <CardDescription>Acota por EPS, diagnóstico, sede, médico y rango temporal.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-6">
          <div className="grid gap-2">
            <span className="text-sm text-muted-foreground">EPS</span>
            <Select value={epsFilter} onValueChange={setEpsFilter}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                {epsOptions.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e === 'all' ? 'Todas' : e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <span className="text-sm text-muted-foreground">Diagnóstico</span>
            <Select value={dxFilter} onValueChange={setDxFilter}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                {dxOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d === 'all' ? 'Todos' : d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <span className="text-sm text-muted-foreground">Sede</span>
            <Select value={sedeFilter} onValueChange={setSedeFilter}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                {sedeOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'Todas' : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <span className="text-sm text-muted-foreground">Médico</span>
            <Select value={medicoFilter} onValueChange={setMedicoFilter}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                {medicoOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m === 'all' ? 'Todos' : m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <span className="text-sm text-muted-foreground">Rango</span>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger><SelectValue placeholder="6 meses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Solo no asistidas */}
          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <Checkbox
                id="onlyNoShows"
                checked={onlyNoShows}
                onCheckedChange={(v) => setOnlyNoShows(!!v)}
              />
              <Label htmlFor="onlyNoShows" className="text-sm">Solo no asistidas</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pacientes activos</CardDescription>
            <CardTitle className="text-2xl">{kpis.activos}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <span>Incluye</span>
              <Badge variant="secondary">Activo</Badge>
              <span>y</span>
              <Badge variant="destructive">Alerta</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasa de asistencia</CardDescription>
            <CardTitle className="text-2xl">{kpis.asistenciaPct}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Sobre {kpis.totalEventos} registros.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inasistencias</CardDescription>
            <CardTitle className="text-2xl">{kpis.perdidas}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Citas “no asistió”.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Próximas citas</CardDescription>
            <CardTitle className="text-2xl">{kpis.proximas}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Dentro del rango.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Adherencia promedio</CardDescription>
            <CardTitle className="text-2xl">{kpis.adherenciaProm}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Promedio de seguimientos.</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Serie mensual: asistidas vs perdidas (se adapta al toggle) */}
        <Card className="min-h-[360px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Asistencia mensual</CardTitle>
            <CardDescription>{onlyNoShows ? 'Solo “No asistió”.' : 'Asistencias vs inasistencias.'}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayMonthlySeries} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Legend />
                <Bar dataKey="asistidas" name="Asistidas" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="perdidas" name="No asistidas" fill="hsl(var(--chart-5))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por EPS (pie) */}
        <Card className="min-h-[360px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución por EPS</CardTitle>
            <CardDescription>Pacientes por EPS</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {epsDistrib.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={epsDistrib}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    innerRadius={52}
                    paddingAngle={2}
                    label
                  >
                    {epsDistrib.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors(index)} />
                    ))}
                  </Pie>
                  <Legend />
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Confirmaciones por sede */}
        <Card className="min-h-[360px] lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Confirmaciones por sede</CardTitle>
            <CardDescription>% de próximas citas confirmadas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {confPorSede.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confPorSede} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sede" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <RTooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="porcentaje" name="Confirmación" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Adherencia mensual promedio */}
        <Card className="min-h-[360px] lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Adherencia mensual promedio</CardTitle>
            <CardDescription>Promedio (%) de los seguimientos en el rango</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {adhSeries.every(s => s.promedio === null) ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={adhSeries} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <RTooltip formatter={(v) => (v == null ? '—' : `${v}%`)} />
                  <Legend />
                  <Line type="monotone" dataKey="promedio" name="Adherencia" stroke="hsl(var(--chart-4))" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de eventos */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Eventos en el rango</CardTitle>
            <CardDescription>
              {onlyNoShows ? 'Mostrando solo “No asistió”.' : 'Listado de citas pasadas (asistidas / no asistidas)'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/reportes/resumen">Resumen mensual</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {visibleEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No hay registros para los filtros seleccionados.</p>
            </div>
          ) : (
            <>
              <Table className="rounded-lg border">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead scope="col">Fecha</TableHead>
                    <TableHead scope="col">Paciente</TableHead>
                    <TableHead scope="col">Identificación</TableHead>
                    <TableHead scope="col">Estado</TableHead>
                    <TableHead scope="col">EPS</TableHead>
                    <TableHead scope="col">Diagnóstico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleEvents.map((r, i) => (
                    <TableRow key={`${r.idNumber}-${r.fecha}-${i}`}>
                      <TableCell className="tabular-nums">{r.fecha}</TableCell>
                      <TableCell className="font-medium">{r.paciente}</TableCell>
                      <TableCell className="tabular-nums">{r.idNumber}</TableCell>
                      <TableCell>
                        {r.estado === 'asistida' ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Asistida</Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200">No asistió</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{r.eps}</Badge>
                      </TableCell>
                      <TableCell>{r.diagnostico}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Total registros: {visibleEvents.length}
                  {onlyNoShows && ' (solo “No asistió”)'}
                </TableCaption>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full w-full grid place-items-center">
      <div className="text-center">
        <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>
      </div>
    </div>
  );
}

