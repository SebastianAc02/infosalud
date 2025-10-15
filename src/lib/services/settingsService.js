/// file: src/lib/services/settingsService.js
// Servicio FRONT-ONLY
// Expone funciones async para simular fetch y facilitar el reemplazo por una API real.

const LS_PREFIX = 'infosalud.settings';
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const DEFAULT_SETTINGS = {
  notifications: {
    cita_sms: true,
    cita_email: false,
    medicamento_push: true,
    resumen_semanal_email: true,
  },
  schedule: {
    cita: { daysBefore: 1, time: '18:00' },
    medicamento: { time: '08:00' },
    resumen_semanal: { weekday: 1, time: '17:00' }, // lunes 17:00
  },
  defaultsPaciente: {
    canales: { sms: true, email: false, push: true },
  },
};

function keyFor(userKey = 'anon@local') {
  return `${LS_PREFIX}:${userKey}`;
}

export async function loadSettings(userKey) {
  await delay();
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(keyFor(userKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveSettings(userKey, settings) {
  await delay();
  if (typeof window === 'undefined') return;
  localStorage.setItem(keyFor(userKey), JSON.stringify(settings));
}
