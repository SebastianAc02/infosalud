// file: src/app/(dashboard)/settings/page.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '@/components/ui/select';

import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
} from '@/lib/services/settingsService';
import {
  loadUsers,
  createUser,
  updateUser,
  deleteUser as removeUser,
  roleLabel,
} from '@/lib/services/usersService';

import { usePatients } from '@/context/PatientContext';

function isAdmin(role) {
  return String(role || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase() === 'administrador';
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const name = session?.user?.name || 'Usuario';
  const email = session?.user?.email || 'anon@local';
  const role = roleLabel(session?.user?.role);
  const userKey = email;
  const admin = isAdmin(session?.user?.role);

  // Preferencias personales (frontend-only)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Gestión de usuarios (solo admin)
  const [users, setUsers] = useState([]);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formUser, setFormUser] = useState({ name: '', email: '', role: 'auxiliar', eps: '', estado: 'activo' });

  // Pacientes: preferencias de contacto por paciente
  const { patients, updateCanalesPaciente } = usePatients();
  const [selectedId, setSelectedId] = useState('');
  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedId) || null,
    [selectedId, patients]
  );
  const [channels, setChannels] = useState({ sms: false, email: false, push: false });

  // ─────────────────────────────────────────────────────────────
  // NUEVO: Información de la cuenta con verificación por correo
  // ─────────────────────────────────────────────────────────────
  const savedAccount = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('accountInfoOverrides') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [accName, setAccName] = useState(savedAccount.name ?? name);
  const [accPhone, setAccPhone] = useState(savedAccount.phone ?? '');
  const [wantPasswordChange, setWantPasswordChange] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');

  const [accDirty, setAccDirty] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setAccDirty(
      accName !== (savedAccount.name ?? name) ||
      accPhone !== (savedAccount.phone ?? '') ||
      (wantPasswordChange && newPass.length > 0)
    );
  }, [accName, accPhone, wantPasswordChange, newPass, name, savedAccount]);

  const submitAccount = (e) => {
    e?.preventDefault?.();
    if (!accDirty) {
      toast('No hay cambios para guardar.');
      return;
    }
    if (wantPasswordChange && newPass !== newPass2) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    setVerifyOpen(true);
    toast.success(`Enviamos un código de verificación a ${email}`);
  };

  const confirmAccountCode = async () => {
    if (verifyCode.trim().length !== 6) {
      toast.error('Ingresa el código de 6 dígitos.');
      return;
    }
    try {
      setIsVerifying(true);
      // Simulación (aquí iría la verificación real con backend)
      await new Promise((r) => setTimeout(r, 800));

      const payload = {
        name: accName.trim(),
        phone: accPhone.trim(),
        // Nota: el password change NO se aplica en front-only.
      };
      localStorage.setItem('accountInfoOverrides', JSON.stringify(payload));

      setVerifyOpen(false);
      setVerifyCode('');
      setWantPasswordChange(false);
      setNewPass('');
      setNewPass2('');
      toast.success('Cambios confirmados. Se aplicarán al iniciar sesión nuevamente.');
    } finally {
      setIsVerifying(false);
    }
  };
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [stored, usersData] = await Promise.all([
          loadSettings(userKey).catch(() => null),
          loadUsers().catch(() => []),
        ]);
        if (stored) {
          const s = stored;
          setSettings({
            ...DEFAULT_SETTINGS,
            ...s,
            notifications: { ...DEFAULT_SETTINGS.notifications, ...(s.notifications || {}) },
            schedule: {
              ...DEFAULT_SETTINGS.schedule, ...(s.schedule || {}),
              cita: { ...DEFAULT_SETTINGS.schedule.cita, ...(s.schedule?.cita || {}) },
              medicamento: { ...DEFAULT_SETTINGS.schedule.medicamento, ...(s.schedule?.medicamento || {}) },
              resumen_semanal: { ...DEFAULT_SETTINGS.schedule.resumen_semanal, ...(s.schedule?.resumen_semanal || {}) },
            },
          });
        }
        setUsers(usersData || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [userKey]);

  // Sincroniza toggles cuando cambia el paciente seleccionado
  useEffect(() => {
    if (!selectedPatient) {
      setChannels({ sms: false, email: false, push: false });
      return;
    }
    const c = selectedPatient.canales || { sms: true, email: false, push: true };
    setChannels({
      sms: !!c.sms,
      email: !!c.email,
      push: !!c.push,
    });
  }, [selectedPatient]);

  const toggleNotif = (key) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] },
    }));
  };

  const save = async () => {
    try {
      await saveSettings(userKey, settings);
      toast.success('Configuración guardada');
    } catch (e) {
      toast.error(e.message || 'Error al guardar');
    }
  };

  // CRUD usuarios
  const onOpenNewUser = () => {
    setEditing(null);
    setFormUser({ name: '', email: '', role: 'auxiliar', eps: '', estado: 'activo' });
    setUserDialogOpen(true);
  };
  const onEditUser = (u) => {
    setEditing(u.id);
    setFormUser({ id: u.id, name: u.name, email: u.email, role: u.role, eps: u.eps || '', estado: u.estado || 'activo' });
    setUserDialogOpen(true);
  };
  const onSaveUser = async () => {
    try {
      if (editing) {
        const updated = await updateUser(formUser);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        toast.success('Usuario actualizado');
      } else {
        const created = await createUser(formUser);
        setUsers((prev) => [created, ...prev]);
        toast.success('Usuario creado');
      }
      setUserDialogOpen(false);
    } catch (e) {
      toast.error(e.message || 'Error guardando usuario');
    }
  };
  const onDeleteUser = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await removeUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('Usuario eliminado');
    } catch (e) {
      toast.error(e.message || 'Error eliminando usuario');
    }
  };

  // Guardar preferencias de contacto del paciente
  const savePatientChannels = () => {
    if (!selectedPatient) {
      toast.error('Selecciona un paciente');
      return;
    }
    updateCanalesPaciente(selectedPatient.id, channels);
    toast.success(`Preferencias guardadas para ${selectedPatient.nombre}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded lg:col-span-2" />
        </div>
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Preferencias del usuario y parámetros de la aplicación (frontend-only)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Perfil (solo lectura) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Información de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input value={name} readOnly aria-readonly />
            </div>
            <div className="grid gap-2">
              <Label>Correo</Label>
              <Input value={email} readOnly aria-readonly />
            </div>
            <div className="grid gap-2">
              <Label>Rol</Label>
              <Input value={role} readOnly aria-readonly />
            </div>
          </CardContent>
        </Card>

        {/* Recordatorios */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recordatorios</CardTitle>
            <CardDescription>
              Activa los tipos de recordatorio y define horario/ventana de envío.
              <br />
              <span className="text-xs text-muted-foreground">
                Citas/medicación: se envían al paciente. Resumen semanal: se envía a tu correo.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {[
                ['cita_sms', 'Recordatorio de cita por SMS', 'Enviar SMS el día anterior al paciente.'],
                ['cita_email', 'Recordatorio de cita por email', 'Correo 24–48 horas antes al paciente.'],
                ['medicamento_push', 'Recordatorio de medicación (push)', 'Notificación diaria al paciente.'],
                ['resumen_semanal_email', 'Resumen semanal por email', 'Reporte semanal a tu correo.'],
              ].map(([key, title, desc]) => (
                <div key={key} className="flex items-start gap-3">
                  <Checkbox id={key} checked={!!settings.notifications[key]} onCheckedChange={() => toggleNotif(key)} />
                  <div>
                    <Label htmlFor={key}>{title}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Días antes (cita)</Label>
                <Input
                  type="number" min={0} max={7}
                  value={settings.schedule.cita.daysBefore}
                  onChange={(e) => setSettings(s => ({ ...s, schedule: { ...s.schedule, cita: { ...s.schedule.cita, daysBefore: Number(e.target.value) } } }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Hora de envío (cita)</Label>
                <Input
                  type="time"
                  value={settings.schedule.cita.time}
                  onChange={(e) => setSettings(s => ({ ...s, schedule: { ...s.schedule, cita: { ...s.schedule.cita, time: e.target.value } } }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Hora diaria (medicación)</Label>
                <Input
                  type="time"
                  value={settings.schedule.medicamento.time}
                  onChange={(e) => setSettings(s => ({ ...s, schedule: { ...s.schedule, medicamento: { ...s.schedule.medicamento, time: e.target.value } } }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Día y hora (resumen semanal)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={String(settings.schedule.resumen_semanal.weekday)}
                    onValueChange={(v) => setSettings(s => ({ ...s, schedule: { ...s.schedule, resumen_semanal: { ...s.schedule.resumen_semanal, weekday: Number(v) } } }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7].map((d) => (
                        <SelectItem key={d} value={String(d)}>{['', 'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][d]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="time"
                    value={settings.schedule.resumen_semanal.time}
                    onChange={(e) => setSettings(s => ({ ...s, schedule: { ...s.schedule, resumen_semanal: { ...s.schedule.resumen_semanal, time: e.target.value } } }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={save}>Guardar cambios</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NUEVO: Información de la cuenta (editable con verificación por correo) */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la cuenta</CardTitle>
          <CardDescription>
            Cambia tu nombre y teléfono. Para aplicar, confirma con el código enviado a tu correo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submitAccount}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="accName">Nombre completo</Label>
                <Input
                  id="accName"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accEmail">Correo</Label>
                <Input id="accEmail" value={email} disabled />
                <p className="text-xs text-muted-foreground">
                  El correo lo gestiona tu EPS. Para cambiarlo, contacta a administración.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="accPhone">Teléfono (opcional)</Label>
                <Input
                  id="accPhone"
                  value={accPhone}
                  onChange={(e) => setAccPhone(e.target.value)}
                  placeholder="Ej. 3001234567"
                  inputMode="tel"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accRole">Rol</Label>
                <Input id="accRole" value={role} disabled />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="accPassToggle"
                checked={wantPasswordChange}
                onCheckedChange={(v) => setWantPasswordChange(!!v)}
              />
              <Label htmlFor="accPassToggle">Quiero cambiar mi contraseña</Label>
            </div>

            {wantPasswordChange && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="accPass">Nueva contraseña</Label>
                  <Input
                    id="accPass"
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="accPass2">Repetir contraseña</Label>
                  <Input
                    id="accPass2"
                    type="password"
                    value={newPass2}
                    onChange={(e) => setNewPass2(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Nota: el cambio de contraseña requiere backend; aquí solo mostramos el flujo de verificación.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={!accDirty}>Guardar cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preferencias de contacto del paciente (por paciente) */}
      <Card>
        <CardHeader>
          <CardTitle>Preferencias de contacto del paciente</CardTitle>
          <CardDescription>
            Registra el método de contacto que el paciente prefiere (se guarda en su ficha).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {patients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay pacientes registrados.
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Paciente</Label>
                  <Select
                    value={selectedId}
                    onValueChange={(v) => setSelectedId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} — {p.idNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPatient && (
                  <div className="grid gap-1 self-end">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{selectedPatient.nombre}</span> · {selectedPatient.eps} · {selectedPatient.diagnostico}
                    </p>
                  </div>
                )}
              </div>

              {selectedPatient ? (
                <>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      ['sms', 'SMS', 'Envío de mensajes de texto al teléfono del paciente.'],
                      ['email', 'Email', 'Correos electrónicos a la dirección del paciente.'],
                      ['push', 'Push', 'Notificaciones en la app (si aplica).'],
                    ].map(([key, label, desc]) => (
                      <div key={key} className="flex items-start gap-3">
                        <Checkbox
                          id={`ch_${key}`}
                          checked={!!channels[key]}
                          onCheckedChange={() => setChannels((c) => ({ ...c, [key]: !c[key] }))}
                        />
                        <div>
                          <Label htmlFor={`ch_${key}`}>{label}</Label>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={savePatientChannels}>Guardar preferencias del paciente</Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecciona un paciente para editar sus preferencias.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Gestión de usuarios (solo admin) */}
      {admin ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Gestión de usuarios</CardTitle>
              <CardDescription>Crear, editar y desactivar cuentas del personal.</CardDescription>
            </div>
            <Button variant="outline" onClick={onOpenNewUser}>Nuevo usuario</Button>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay usuarios registrados.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {['Nombre','Email','Rol','EPS','Estado',''].map((h) => (
                        <th key={h} className="text-left text-xs uppercase tracking-wide text-muted-foreground py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[&>tr>td]:py-2 [&>tr>td]:px-3">
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border">
                        <td className="font-medium">{u.name}</td>
                        <td className="tabular-nums">{u.email}</td>
                        <td>{roleLabel(u.role)}</td>
                        <td>{u.eps || '—'}</td>
                        <td>{(u.estado || 'activo') === 'activo' ? 'Activo' : 'Inactivo'}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => onEditUser(u)}>Editar</Button>
                            <Button variant="dangerSoft" size="sm" onClick={() => onDeleteUser(u.id)}>Eliminar</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gestión de usuarios</CardTitle>
            <CardDescription>Acceso restringido a administradores.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contacta a un administrador si necesitas crear o modificar cuentas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Diálogo crear/editar usuario (solo se abre si admin) */}
      <Dialog open={admin && userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
            <DialogDescription>Completa los campos y guarda.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                value={formUser.name}
                onChange={(e) => setFormUser(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formUser.email}
                onChange={(e) => setFormUser(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Rol</Label>
                <Select
                  value={formUser.role}
                  onValueChange={(v) => setFormUser(f => ({ ...f, role: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona rol" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medico">Médico</SelectItem>
                    <SelectItem value="auxiliar">Auxiliar</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>EPS</Label>
                <Input
                  value={formUser.eps}
                  onChange={(e) => setFormUser(f => ({ ...f, eps: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select
                  value={formUser.estado}
                  onValueChange={(v) => setFormUser(f => ({ ...f, estado: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
            <Button onClick={onSaveUser}>{editing ? 'Guardar' : 'Crear'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de verificación por correo (para Información de la cuenta) */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirma los cambios</DialogTitle>
            <DialogDescription>
              Te enviamos un código de 6 dígitos a <span className="font-medium">{email}</span>. Ingresa el código para aplicar los cambios de tu cuenta.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="verifyCode">Código de verificación</Label>
            <Input
              id="verifyCode"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D+/g, '').slice(0, 6))}
              className="tracking-widest text-center text-lg"
            />
            <p className="text-xs text-muted-foreground">
              ¿No recibiste el correo? Puedes reenviar en unos segundos.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVerifyOpen(false)}>Cancelar</Button>
            <Button onClick={confirmAccountCode} disabled={verifyCode.length !== 6 || isVerifying}>
              {isVerifying ? 'Verificando…' : 'Confirmar y guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

