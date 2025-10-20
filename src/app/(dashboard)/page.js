// src/app/(dashboard)/page.js
'use client';

import { usePatients } from '@/context/PatientContext';
import { useMemo } from 'react';
import Link from 'next/link';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const { patients } = usePatients();

  const kpis = useMemo(() => {
    const ahora = new Date();
    const primerDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    let totalCitasPasadas = 0;
    let totalCitasAsistidas = 0;
    const patientsWithLostAppointments = new Map();

    patients.forEach(patient => {
      if (patient.citasPasadas) {
        patient.citasPasadas.forEach(cita => {
          totalCitasPasadas++;
          if (cita.estado === 'asistida') {
            totalCitasAsistidas++;
          }
          if (cita.estado === 'perdida' && new Date(cita.fecha) >= primerDiaDelMes) {
            if (!patientsWithLostAppointments.has(patient.id)) {
              patientsWithLostAppointments.set(patient.id, { ...patient, citasPerdidasEsteMes: [] });
            }
            patientsWithLostAppointments.get(patient.id).citasPerdidasEsteMes.push(cita.fecha);
          }
        });
      }
    });

    const adherencia = totalCitasPasadas > 0 ? Math.round((totalCitasAsistidas / totalCitasPasadas) * 100) : 0;
    const patientsInAlert = patients.filter(p => p.estado === 'alerta');

    return {
      citasPerdidas: patientsWithLostAppointments.size,
      adherenciaGeneral: `${adherencia}%`,
      activeAlerts: patientsInAlert.length,
      patientsInAlert: patientsInAlert,
      patientsWithLostAppointments: Array.from(patientsWithLostAppointments.values()),
    };
  }, [patients]);

  return (
    <div>
      <h1 className="text-3xl font-bold font-heading mb-6 text-foreground">
        Dashboard principal
      </h1>
      <p className="mb-8 text-muted-foreground">
        Resumen general del estado de los pacientes crónicos.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tarjeta de Citas Perdidas */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md cursor-pointer hover:bg-muted/50 transition-colors">
              <h3 className="font-bold font-heading text-lg text-muted-foreground">
                Citas perdidas (mes)
              </h3>
              <p className="text-2xl font-bold mt-2 text-foreground">
                {kpis.citasPerdidas}
              </p>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pacientes con citas perdidas este mes</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {kpis.patientsWithLostAppointments.length > 0 ? (
                kpis.patientsWithLostAppointments.map(patient => (
                  <div key={patient.id} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                    <div>
                      <p className="font-semibold">{patient.nombre}</p>
                      <p className="text-sm text-muted-foreground">Perdió {patient.citasPerdidasEsteMes.length} cita(s)</p>
                    </div>
                    <Link href={`/pacientes/${patient.id}`} className="text-sm text-primary hover:underline">
                      Ver perfil
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay pacientes con citas perdidas este mes.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Tarjeta de Alertas Activas */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md cursor-pointer hover:bg-muted/50 transition-colors">
              <h3 className="font-bold font-heading text-lg text-muted-foreground">
                Alertas activas
              </h3>
              <p className="text-2xl font-bold mt-2 text-yellow-500">
                {kpis.activeAlerts}
              </p>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pacientes con alertas activas</DialogTitle>
              <DialogDescription>
                Estos pacientes requieren atención prioritaria.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {kpis.patientsInAlert.length > 0 ? (
                kpis.patientsInAlert.map(patient => (
                  <div key={patient.id} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                    <div>
                      <p className="font-semibold">{patient.nombre}</p>
                      <p className="text-sm text-muted-foreground">{patient.diagnostico}</p>
                    </div>
                    <Link href={`/pacientes/${patient.id}`} className="text-sm text-primary hover:underline">
                      Ver perfil
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay pacientes con alertas activas.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Tarjeta de Adherencia General */}
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md">
          <h3 className="font-bold font-heading text-lg text-muted-foreground">
            Adherencia general
          </h3>
          <p className="text-2xl font-bold mt-2 text-foreground">
            {kpis.adherenciaGeneral}
          </p>
        </div>
      </div>
    </div>
  );
}