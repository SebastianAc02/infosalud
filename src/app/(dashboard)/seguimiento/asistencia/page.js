/// file: src/app/(dashboard)/seguimiento/asistencia/page.js
'use client';

import { useState, useMemo } from 'react';
import { usePatients } from '@/context/PatientContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

// Utils
const parseISOasLocalDate = (isoDateStr) => {
  if (!isoDateStr) return null;
  const [y, m, d] = isoDateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const formatDateES = (isoDateStr) => {
  const dt = parseISOasLocalDate(isoDateStr);
  if (!dt) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dt);
  } catch {
    return isoDateStr;
  }
};

const estadoToBadge = (estado) => {
  switch ((estado || '').toLowerCase()) {
    case 'alerta':
      return { label: 'Alerta', variant: 'destructive' };
    case 'inactivo':
      return { label: 'Inactivo', variant: 'outline' };
    case 'activo':
    default:
      return { label: 'Activo', variant: 'secondary' };
  }
};

export default function RegistrarAsistenciaPage() {
  const { patients, registrarAsistencia } = usePatients();

  // Pacientes con próxima cita
  const pacientesConCita = useMemo(
    () => patients.filter((p) => p.proximaCita),
    [patients]
  );

  // Filtro por nombre o documento
  const [q, setQ] = useState('');
  const norm = (s = '') =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const digits = (s = '') => String(s).replace(/\D+/g, '');

  const filteredPacientes = useMemo(() => {
    if (!q.trim()) return pacientesConCita;
    const s = norm(q.trim());
    const d = digits(q);

    return pacientesConCita.filter((p) => {
      const nombre = norm(
        [p.nombre, p.apellidos, p.name, p.lastName].filter(Boolean).join(' ')
      );
      const doc = digits(p.idNumber ?? p.documento ?? p.identificacion ?? p.id ?? '');
      return (s && nombre.includes(s)) || (d && doc.includes(d));
    });
  }, [q, pacientesConCita]);

  const handleRegistro = (paciente, condicion) => {
    registrarAsistencia(paciente.id, condicion);
    const fechaBonita = formatDateES(paciente.proximaCita);
    toast.success(
      `${condicion === 'asistida' ? 'Asistencia' : 'Inasistencia'} registrada: ${paciente.nombre} — ${fechaBonita}`
    );
  };

  return (
    <div>
      {/* Título unificado */}
      <h1>Registrar Asistencia de Citas</h1>

      {/* Filtro */}
      {pacientesConCita.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtrar paciente</CardTitle>
            <CardDescription>Busca por nombre o número de identificación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-w-xl">
              <Label htmlFor="q">Nombre o documento</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="q"
                  placeholder="Ej: Ana García o 1036645879"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9"
                  aria-label="Buscar paciente por nombre o número de identificación"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pacientesConCita.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay citas pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Todos los pacientes tienen su historial de citas al día.</p>
          </CardContent>
        </Card>
      ) : filteredPacientes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin resultados</CardTitle>
            <CardDescription>
              No encontramos pacientes que coincidan con “{q}”.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setQ('')}>
              Limpiar filtro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            Mostrando {filteredPacientes.length} de {pacientesConCita.length} con cita programada
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPacientes.map((paciente) => {
              const estado = estadoToBadge(paciente.estado);
              return (
                <Card key={paciente.id}>
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="leading-tight">{paciente.nombre}</CardTitle>
                      <Badge variant={estado.variant}>{estado.label}</Badge>
                    </div>
                    <CardDescription className="text-sm">
                      ID: {paciente.idNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      Cita programada para{' '}
                      <span className="font-semibold">
                        {formatDateES(paciente.proximaCita)}
                      </span>
                    </p>
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleRegistro(paciente, 'asistida')}
                        variant="successSoft"
                        className="w-full"
                      >
                        Asistió
                      </Button>
                      <Button
                        onClick={() => handleRegistro(paciente, 'perdida')}
                        variant="dangerSoft"
                        className="w-full"
                      >
                        No asistió
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
