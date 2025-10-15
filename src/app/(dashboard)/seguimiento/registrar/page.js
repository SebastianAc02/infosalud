// file: src/app/(dashboard)/seguimiento/registrar/page.js
'use client';

import { useMemo, useState } from 'react';
import { usePatients } from '@/context/PatientContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { Phone, MessageSquareMore, Send } from 'lucide-react';

/** Calcula adherencia como % de citas asistidas sobre el total de citas pasadas */
function calcAdherencia(paciente) {
  const total = (paciente.citasPasadas || []).length;
  if (!total) return 0;
  const asistidas = paciente.citasPasadas.filter(c => c.estado === 'asistida').length;
  return Math.round((asistidas / total) * 100);
}

export default function RegistrarSeguimientoPage() {
  const { patients, addSeguimiento } = usePatients();

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [canal, setCanal] = useState('sms'); // sms | whatsapp | llamada
  const [resultado, setResultado] = useState('no_contesta'); // confirmo | reprogramar | no_contesta | rechazo
  const [notas, setNotas] = useState('');
  const [generarAlerta, setGenerarAlerta] = useState(false);

  const listaFiltrada = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(p =>
      p.nombre.toLowerCase().includes(q) || String(p.idNumber).includes(q)
    );
  }, [patients, query]);

  const pacienteSel = useMemo(
    () => patients.find(p => p.id === selectedId),
    [patients, selectedId]
  );

  const telUrl = pacienteSel?.celular ? `tel:+57${String(pacienteSel.celular).replace(/\D+/g, '')}` : '#';
  const waUrl = pacienteSel?.celular ? `https://wa.me/57${String(pacienteSel.celular).replace(/\D+/g, '')}` : '#';
  const smsUrl = pacienteSel?.celular ? `sms:+57${String(pacienteSel.celular).replace(/\D+/g, '')}` : '#';

  const handleGuardar = (e) => {
    e.preventDefault();
    if (!selectedId) {
      toast.error('Selecciona un paciente.');
      return;
    }
    addSeguimiento(selectedId, { canal, resultado, notas, generarAlerta });
    toast.success('Seguimiento registrado.');
    setResultado('no_contesta');
    setNotas('');
    setGenerarAlerta(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Registrar Seguimiento</h1>
        <p className="text-sm text-muted-foreground">
          Registra intentos de contacto (SMS, WhatsApp o Llamada) y su resultado. La adherencia se calcula automáticamente por paciente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del seguimiento</CardTitle>
          <CardDescription>Busca el paciente, selecciona el canal y registra el resultado.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleGuardar}>
            {/* Búsqueda y selección */}
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label htmlFor="buscar">Buscar paciente</Label>
                <Input
                  id="buscar"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nombre o identificación…"
                />
              </div>
              <div>
                <Label>Paciente</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {listaFiltrada.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} — {p.idNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumen del paciente seleccionado */}
            {pacienteSel && (
              <div className="rounded-lg border p-4 flex flex-wrap items-center gap-3 bg-muted/20">
                <div className="flex-1 min-w-[220px]">
                  <p className="text-sm text-muted-foreground">EPS / Dx</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">EPS: {pacienteSel.eps}</Badge>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Dx: {pacienteSel.diagnostico}</Badge>
                  </div>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm text-muted-foreground">Próxima cita</p>
                  <p className="font-medium">{pacienteSel.proximaCita || '—'}</p>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm text-muted-foreground">Adherencia</p>
                  <p className="font-medium">{calcAdherencia(pacienteSel)}%</p>
                </div>
                {/* Acciones rápidas */}
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <a href={telUrl}><Phone className="h-4 w-4 mr-2" /> Llamar</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={waUrl} target="_blank" rel="noreferrer">
                      <MessageSquareMore className="h-4 w-4 mr-2" /> WhatsApp
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={smsUrl}><Send className="h-4 w-4 mr-2" /> SMS</a>
                  </Button>
                </div>
              </div>
            )}

            {/* Formulario de registro */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Canal</Label>
                <Select value={canal} onValueChange={setCanal}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="llamada">Llamada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Resultado</Label>
                <Select value={resultado} onValueChange={setResultado}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmo">Confirmó asistencia</SelectItem>
                    <SelectItem value="reprogramar">Solicita reprogramar</SelectItem>
                    <SelectItem value="no_contesta">No contesta</SelectItem>
                    <SelectItem value="rechazo">Rechazó</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="alerta"
                  checked={generarAlerta}
                  onCheckedChange={(v) => setGenerarAlerta(!!v)}
                />
                <Label htmlFor="alerta">Generar alerta temprana</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                rows={4}
                placeholder="Observaciones del contacto…"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit">Guardar registro</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
