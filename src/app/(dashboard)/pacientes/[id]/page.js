// file: src/app/(dashboard)/pacientes/[id]/page.js
'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePatients } from '@/context/PatientContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowLeft, Phone, MessageSquareMore, Check, X, Pencil, Save } from 'lucide-react';

const EstadoBadge = ({ estado }) => {
  const e = String(estado || '').toLowerCase();
  if (e === 'alerta') return <Badge variant="destructive">Alerta</Badge>;
  if (e === 'inactivo') return <Badge variant="outline">Inactivo</Badge>;
  return <Badge variant="secondary">Activo</Badge>;
};

const ChannelBadge = ({ active, label }) => (
  <Badge className={active ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted'}>
    {label}{active ? '' : ' (desactivado)'}
  </Badge>
);

export default function PacienteDetailPage({ params }) {
  const {
    patients,
    updateContact,
    updateCanales,
    setProximaCitaEstado,
    reprogramarCita,
    setPlanTratamiento,
    setSedeMedico,
  } = usePatients();

  const paciente = useMemo(() => patients.find((p) => p.id === params.id), [patients, params.id]);
  if (!paciente) notFound();

  const canales = paciente.canales || { sms: true, email: false, push: true };

  // Catálogos dinámicos (de la data existente)
  const sedesOptions = useMemo(
    () => Array.from(new Set(patients.map(p => p.sede).filter(Boolean))).sort(),
    [patients]
  );
  const medicosOptions = useMemo(
    () => Array.from(new Set(patients.map(p => p.medicoAsignado).filter(Boolean))).sort(),
    [patients]
  );

  // Estados locales
  const [contact, setContact] = useState({
    email: paciente.email || '',
    celular: paciente.celular || '',
    fijo: paciente.fijo || '',
    direccion: paciente.direccion || '',
  });

  const [plan, setPlan] = useState({
    objetivos: paciente.planTratamiento?.objetivos || '',
    medicacion: paciente.planTratamiento?.medicacion || '',
    notas: paciente.planTratamiento?.notas || '',
  });

  const [reprog, setReprog] = useState({ fecha: '', motivo: '' });

  const [editAdmin, setEditAdmin] = useState(false);
  const [sedeSel, setSedeSel] = useState(paciente.sede || '');
  const [medicoSel, setMedicoSel] = useState(paciente.medicoAsignado || '');
  const [sedeCustom, setSedeCustom] = useState('');
  const [medicoCustom, setMedicoCustom] = useState('');

  const saveContact = () => updateContact(paciente.id, contact);
  const savePlan = () => setPlanTratamiento(paciente.id, plan);

  const confirmCita = () => setProximaCitaEstado(paciente.id, 'confirmada');
  const rejectCita = () => setProximaCitaEstado(paciente.id, 'rechazada');
  const reprogCita = () => {
    if (!reprog.fecha) return;
    reprogramarCita(paciente.id, reprog.fecha, reprog.motivo);
    setReprog({ fecha: '', motivo: '' });
  };

  const saveSedeMedico = () => {
    const finalSede = sedeSel === '__custom__' ? sedeCustom.trim() : sedeSel;
    const finalMedico = medicoSel === '__custom__' ? medicoCustom.trim() : medicoSel;
    setSedeMedico(paciente.id, {
      sede: finalSede || undefined,
      medicoAsignado: finalMedico || undefined,
    });
    setEditAdmin(false);
    if (finalSede) setSedeSel(finalSede);
    if (finalMedico) setMedicoSel(finalMedico);
    setSedeCustom('');
    setMedicoCustom('');
  };

  const waUrl = paciente.celular ? `https://wa.me/57${paciente.celular.replace(/\D+/g, '')}` : '#';
  const telUrl = paciente.celular ? `tel:+57${paciente.celular.replace(/\D+/g, '')}` : '#';

  const estadoProxima = (() => {
    const v = (paciente.proximaCitaEstado || '').toLowerCase();
    if (v === 'confirmada') return 'Confirmada';
    if (v === 'rechazada') return 'Rechazada';
    if (v === 'pendiente') return 'Pendiente';
    return '—';
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>{paciente.nombre}</h1>
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
            <span>ID:</span>
            <span className="tabular-nums">{paciente.idNumber}</span>
            <span className="mx-2">•</span>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">EPS: {paciente.eps}</Badge>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Dx: {paciente.diagnostico}</Badge>
            <EstadoBadge estado={paciente.estado} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/pacientes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información clínica y próxima cita */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información clínica</CardTitle>
            <CardDescription>Resumen general y gestión de cita</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bloque Sede / Médico / Próxima cita */}
            <div className="grid sm:grid-cols-3 gap-4">
              {/* Sede */}
              <div>
                <p className="text-xs text-muted-foreground">Sede</p>
                {!editAdmin ? (
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{paciente.sede || '—'}</p>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditAdmin(true)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Select value={sedeSel || ''} onValueChange={setSedeSel}>
                      <SelectTrigger><SelectValue placeholder="Selecciona sede" /></SelectTrigger>
                      <SelectContent>
                        {sedesOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        <SelectItem value="__custom__">Otro (escribir)…</SelectItem>
                      </SelectContent>
                    </Select>
                    {sedeSel === '__custom__' && (
                      <Input placeholder="Nombre de la sede" value={sedeCustom} onChange={(e) => setSedeCustom(e.target.value)} />
                    )}
                  </div>
                )}
              </div>

              {/* Médico asignado */}
              <div>
                <p className="text-xs text-muted-foreground">Médico asignado</p>
                {!editAdmin ? (
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{paciente.medicoAsignado || '—'}</p>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditAdmin(true)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Select value={medicoSel || ''} onValueChange={setMedicoSel}>
                      <SelectTrigger><SelectValue placeholder="Selecciona médico" /></SelectTrigger>
                      <SelectContent>
                        {medicosOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        <SelectItem value="__custom__">Otro (escribir)…</SelectItem>
                      </SelectContent>
                    </Select>
                    {medicoSel === '__custom__' && (
                      <Input placeholder="Nombre del médico" value={medicoCustom} onChange={(e) => setMedicoCustom(e.target.value)} />
                    )}
                  </div>
                )}
              </div>

              {/* Próxima cita */}
              <div>
                <p className="text-xs text-muted-foreground">Próxima cita</p>
                <p className="font-medium">{paciente.proximaCita ? paciente.proximaCita : '—'}</p>
                {paciente.proximaCita && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-muted text-muted-foreground">Estado: {estadoProxima}</Badge>
                    <Button size="sm" variant="outline" onClick={confirmCita} className="whitespace-nowrap">
                      <Check className="h-4 w-4 mr-1" /> Confirmar
                    </Button>
                    <Button size="sm" variant="outline" onClick={rejectCita} className="whitespace-nowrap">
                      <X className="h-4 w-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones guardar/cancelar para sede/médico */}
            {editAdmin && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveSedeMedico}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditAdmin(false); setSedeSel(paciente.sede || ''); setMedicoSel(paciente.medicoAsignado || ''); setSedeCustom(''); setMedicoCustom(''); }}>
                  Cancelar
                </Button>
              </div>
            )}

            {/* Reprogramación y acciones */}
            {paciente.proximaCita && (
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="reprog-date">Reprogramar cita</Label>
                  <div className="flex gap-2 mt-1">
                    <Input id="reprog-date" type="date" value={reprog.fecha} onChange={(e) => setReprog((r) => ({ ...r, fecha: e.target.value }))} />
                    <Input placeholder="Motivo (opcional)" value={reprog.motivo} onChange={(e) => setReprog((r) => ({ ...r, motivo: e.target.value }))} />
                    <Button variant="outline" onClick={reprogCita}>Aplicar</Button>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <a href={telUrl}><Phone className="h-4 w-4 mr-2" /> Llamar</a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href={waUrl} target="_blank" rel="noreferrer">
                      <MessageSquareMore className="h-4 w-4 mr-2" /> WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Preferencias de contacto */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Preferencias de contacto</p>
              <div className="flex flex-wrap gap-2">
                <ChannelBadge active={!!canales.sms} label="SMS" />
                <ChannelBadge active={!!canales.email} label="Correo" />
                <ChannelBadge active={!!canales.push} label="Push" />
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => updateCanales(paciente.id, { sms: !canales.sms })}>
                  SMS: {canales.sms ? 'Activo' : 'Desactivado'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateCanales(paciente.id, { email: !canales.email })}>
                  Correo: {canales.email ? 'Activo' : 'Desactivado'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateCanales(paciente.id, { push: !canales.push })}>
                  Push: {canales.push ? 'Activo' : 'Desactivado'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editar contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de contacto</CardTitle>
            <CardDescription>Actualiza correo y teléfonos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} placeholder="correo@dominio.com" />
            </div>
            <div>
              <Label htmlFor="cel">Celular</Label>
              <Input id="cel" value={contact.celular} onChange={(e) => setContact((c) => ({ ...c, celular: e.target.value }))} placeholder="3xxxxxxxxx" />
            </div>
            <div>
              <Label htmlFor="fijo">Teléfono fijo</Label>
              <Input id="fijo" value={contact.fijo} onChange={(e) => setContact((c) => ({ ...c, fijo: e.target.value }))} placeholder="(604) xxxxxx" />
            </div>
            <div>
              <Label htmlFor="dir">Dirección</Label>
              <Input id="dir" value={contact.direccion} onChange={(e) => setContact((c) => ({ ...c, direccion: e.target.value }))} placeholder="Dirección de residencia" />
            </div>
            <div className="flex justify-end">
              <Button onClick={saveContact}>Guardar cambios</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan de tratamiento */}
      <Card>
        <CardHeader>
          <CardTitle>Plan de tratamiento</CardTitle>
          <CardDescription>Objetivos, medicación y notas</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label htmlFor="obj">Objetivos</Label>
            <Textarea id="obj" value={plan.objetivos} onChange={(e) => setPlan((p) => ({ ...p, objetivos: e.target.value }))} rows={5} placeholder="Metas clínicas (p. ej., HbA1c &lt; 7%)" />
          </div>
          <div className="sm:col-span-1">
            <Label htmlFor="med">Medicación</Label>
            <Textarea id="med" value={plan.medicacion} onChange={(e) => setPlan((p) => ({ ...p, medicacion: e.target.value }))} rows={5} placeholder="Fármacos, dosis, frecuencia" />
          </div>
          <div className="sm:col-span-1">
            <Label htmlFor="not">Notas</Label>
            <Textarea id="not" value={plan.notas} onChange={(e) => setPlan((p) => ({ ...p, notas: e.target.value }))} rows={5} placeholder="Observaciones, educación, etc." />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <Button onClick={savePlan}>Guardar plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de citas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de citas</CardTitle>
          <CardDescription>Últimos registros</CardDescription>
        </CardHeader>
        <CardContent>
          {paciente.citasPasadas?.length ? (
            <Table className="rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paciente.citasPasadas.map((cita, i) => (
                  <TableRow key={`${cita.fecha}-${i}`}>
                    <TableCell className="tabular-nums">{cita.fecha}</TableCell>
                    <TableCell>
                      {cita.estado === 'asistida' ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Asistida</Badge>
                      ) : (
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200">Perdida</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay historial de citas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
