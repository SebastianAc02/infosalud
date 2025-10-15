// file: src/context/PatientContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const initialPatients = [
  { id: '10293847', idNumber: '1036645879', nombre: 'Ana García', eps: 'Sura', diagnostico: 'Diabetes Tipo 2', proximaCita: '2025-10-28', estado: 'activo', historial: [], direccion: 'Calle 10 #43A-20, Medellín', celular: '3101234567', fijo: '6044445566', citasPasadas: [{ fecha: '2025-07-15', estado: 'asistida' }, { fecha: '2025-04-12', estado: 'asistida' }] },
  { id: '29384756', idNumber: '71258963', nombre: 'Carlos Perez', eps: 'Coomeva', diagnostico: 'Hipertensión', proximaCita: '2025-11-05', estado: 'alerta', historial: [], direccion: 'Carrera 70 #5-30, Medellín', celular: '3119876543', fijo: '6043219876', citasPasadas: [{ fecha: '2025-08-01', estado: 'perdida' }, { fecha: '2025-05-02', estado: 'asistida' }] },
  { id: '38475612', idNumber: '43589621', nombre: 'María Rodríguez', eps: 'Savia Salud', diagnostico: 'EPOC', proximaCita: '2025-10-22', estado: 'activo', historial: [], direccion: 'Avenida 80 #33-15, Medellín', celular: '3123456789', fijo: '6045551234', citasPasadas: [{ fecha: '2025-09-20', estado: 'asistida' }, { fecha: '2025-06-18', estado: 'asistida' }] },
  { id: '47561239', idNumber: '98756321', nombre: 'José Hernández', eps: 'Sura', diagnostico: 'Diabetes Tipo 1', proximaCita: '2025-11-10', estado: 'inactivo', historial: [], direccion: 'Circular 4 #73-05, Medellín', celular: '3137654321', fijo: '6042345678', citasPasadas: [{ fecha: '2025-08-10', estado: 'perdida' }, { fecha: '2025-04-10', estado: 'perdida' }] },
  { id: '56123948', idNumber: '1017458963', nombre: 'Laura Martínez', eps: 'Nueva EPS', diagnostico: 'Hipertensión', proximaCita: '2025-11-12', estado: 'activo', historial: [], direccion: 'Transversal 39B #72-11, Laureles', celular: '3141239876', fijo: '6046543210', citasPasadas: [] },
  { id: '61239485', idNumber: '70258741', nombre: 'Francisco López', eps: 'Coomeva', diagnostico: 'Asma', proximaCita: '2025-11-15', estado: 'activo', historial: [], direccion: 'Calle 50 #81A-40, Calasanz', celular: '3157891234', fijo: '6049876543', citasPasadas: [] },
  { id: '12394856', idNumber: '21589632', nombre: 'Isabel Gómez', eps: 'Savia Salud', diagnostico: 'Diabetes Tipo 2', proximaCita: '2025-11-18', estado: 'alerta', historial: [], direccion: 'Carrera 45 #58-22, El Palo', celular: '3164567890', fijo: '6041234567', citasPasadas: [] },
  { id: '23948561', idNumber: '99587412', nombre: 'Javier Fernández', eps: 'Sura', diagnostico: 'EPOC', proximaCita: '2025-11-20', estado: 'activo', historial: [], direccion: 'Diagonal 75B #2A-120, Belén', celular: '3179873210', fijo: '6047654321', citasPasadas: [] },
];

const PatientContext = createContext();

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState(initialPatients);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedPatients = localStorage.getItem('patients');
    if (storedPatients) {
      setPatients(JSON.parse(storedPatients));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('patients', JSON.stringify(patients));
    }
  }, [patients, isLoaded]);

  /**
   * addSeguimiento
   * Registra un intento de contacto (SMS/WhatsApp/Llamada) con resultado y notas.
   * Si generarAlerta=true, cambia estado del paciente a "alerta".
   * Puede opcionalmente marcar estado de próxima cita (confirmada/rechazada/pendiente).
   */
  const addSeguimiento = (pacienteId, { canal, resultado, notas, generarAlerta }) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== pacienteId) return p;

        const nuevoHistorial = [
          ...p.historial,
          {
            tipo: 'contacto',
            canal,               // 'sms' | 'whatsapp' | 'llamada'
            resultado,           // 'confirmo' | 'reprogramar' | 'no_contesta' | 'rechazo'
            notas: notas || '',
            fecha: new Date().toISOString(),
            generarAlerta: !!generarAlerta,
          },
        ];

        const nuevoEstado = generarAlerta ? 'alerta' : p.estado;

        // Derivar estado de próxima cita según resultado
        let proximaCitaEstado = p.proximaCitaEstado;
        if (resultado === 'confirmo') proximaCitaEstado = 'confirmada';
        else if (resultado === 'rechazo') proximaCitaEstado = 'rechazada';
        else if (resultado === 'reprogramar') proximaCitaEstado = 'pendiente';

        return { ...p, historial: nuevoHistorial, estado: nuevoEstado, proximaCitaEstado };
      })
    );
  };

  const registrarAsistencia = (pacienteId, nuevaCondicion) => {
    const newPatients = patients.map(p => {
      if (p.id === pacienteId) {
        if (!p.proximaCita) return p;
        const citaRegistrada = { fecha: p.proximaCita, estado: nuevaCondicion };
        const nuevasCitasPasadas = [...p.citasPasadas, citaRegistrada];
        return { ...p, proximaCita: null, citasPasadas: nuevasCitasPasadas };
      }
      return p;
    });
    setPatients(newPatients);
  };

  // Helpers de edición
  const updateContact = (pacienteId, contact) => {
    setPatients(ps => ps.map(p => (p.id === pacienteId ? { ...p, ...contact } : p)));
  };
  const updateCanales = (pacienteId, parciales) => {
    setPatients(ps => ps.map(p =>
      p.id === pacienteId
        ? { ...p, canales: { sms: true, email: false, push: true, ...(p.canales || {}), ...parciales } }
        : p
    ));
  };
  const setProximaCitaEstado = (pacienteId, estado) => {
    setPatients(ps => ps.map(p => (p.id === pacienteId ? { ...p, proximaCitaEstado: estado } : p)));
  };
  const reprogramarCita = (pacienteId, fecha, motivo) => {
    setPatients(ps => ps.map(p => (p.id === pacienteId ? { ...p, proximaCita: fecha, reprogramacionMotivo: motivo } : p)));
  };
  const setPlanTratamiento = (pacienteId, plan) => {
    setPatients(ps => ps.map(p => (p.id === pacienteId ? { ...p, planTratamiento: plan } : p)));
  };
  const setSedeMedico = (pacienteId, { sede, medicoAsignado }) => {
    setPatients(ps => ps.map(p =>
      p.id === pacienteId ? { ...p, ...(sede !== undefined ? { sede } : {}), ...(medicoAsignado !== undefined ? { medicoAsignado } : {}) } : p
    ));
  };

  const value = {
    patients,
    addSeguimiento,
    registrarAsistencia,
    updateContact,
    updateCanales,
    setProximaCitaEstado,
    reprogramarCita,
    setPlanTratamiento,
    setSedeMedico,
  };

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatients() {
  return useContext(PatientContext);
}
