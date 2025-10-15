// file: src/lib/services/usersService.js
// Servicio FRONT-ONLY: CRUD de usuarios en localStorage

const LS_KEY = 'infosalud.users';
const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

const seed = [
  { id: 'u_admin_1', name: 'Admin General', email: 'admin@eps.test', role: 'administrador', eps: 'EPS Central', estado: 'activo' },
  { id: 'u_med_1', name: 'Dra. Marcela Ríos', email: 'mrios@eps.test', role: 'medico', eps: 'Sura', estado: 'activo' },
  { id: 'u_aux_1', name: 'Carlos Pérez', email: 'cperez@eps.test', role: 'auxiliar', eps: 'Nueva EPS', estado: 'activo' },
];

function loadFromLS() {
  if (typeof window === 'undefined') return [...seed];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(seed));
      return [...seed];
    }
    return JSON.parse(raw);
  } catch {
    return [...seed];
  }
}

function saveToLS(users) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(users));
}

export function roleLabel(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'medico' || r === 'médico') return 'Médico';
  if (r === 'auxiliar') return 'Auxiliar';
  if (r === 'administrador') return 'Administrador';
  return 'Usuario';
}

export async function loadUsers() {
  await delay();
  return loadFromLS();
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const ALLOWED_ROLES = new Set(['medico', 'auxiliar', 'administrador']);

export async function createUser(user) {
  await delay();
  const users = loadFromLS();
  const requestedRole = String(user.role || '').toLowerCase();
  const role = ALLOWED_ROLES.has(requestedRole) ? requestedRole : 'auxiliar';

  const newUser = {
    id: randomId(),
    name: String(user.name || '').trim(),
    email: String(user.email || '').trim(),
    role,
    eps: String(user.eps || '').trim(),
    estado: user.estado === 'inactivo' ? 'inactivo' : 'activo',
  };
  if (!newUser.name || !newUser.email) {
    throw new Error('Nombre y email son requeridos');
  }
  users.unshift(newUser);
  saveToLS(users);
  return newUser;
}

export async function updateUser(user) {
  await delay();
  const users = loadFromLS();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx === -1) throw new Error('Usuario no encontrado');
  const current = users[idx];

  let nextRole = current.role;
  if (typeof user.role !== 'undefined') {
    const r = String(user.role || '').toLowerCase();
    nextRole = ALLOWED_ROLES.has(r) ? r : current.role;
  }

  const updated = {
    ...current,
    name: user.name ?? current.name,
    email: user.email ?? current.email,
    role: nextRole,
    eps: user.eps ?? current.eps,
    estado: user.estado ?? current.estado,
  };
  users[idx] = updated;
  saveToLS(users);
  return updated;
}

export async function deleteUser(id) {
  await delay();
  const users = loadFromLS();
  const next = users.filter((u) => u.id !== id);
  if (next.length === users.length) throw new Error('Usuario no encontrado');
  saveToLS(next);
  return { ok: true };
}
