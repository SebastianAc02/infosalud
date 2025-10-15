// file: middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = [
  '/login',
  '/auth/login',
  '/api/auth', 
  '/favicon.ico',
  '/favicon.png',
  '/robots.txt',
  '/sitemap.xml',
];

const startsWithPublic = (pathname) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
  pathname.startsWith('/_next/') ||
  pathname.startsWith('/icons/') ||
  pathname.startsWith('/images/') ||
  pathname.startsWith('/assets/');

/**
 * Reglas por rol (además de admin que pasa siempre):
 * - /reportes               -> médico
 * - /seguimiento/asistencia -> médico
 * - /seguimiento/registrar  -> auxiliar
 */
const ROLE_RULES = [
  { pattern: /^\/reportes(\/|$)/, allow: ['medico'] },
  { pattern: /^\/seguimiento\/asistencia(\/|$)/, allow: ['medico'] },
  { pattern: /^\/seguimiento\/registrar(\/|$)/, allow: ['auxiliar'] },
];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Rutas públicas
  if (startsWithPublic(pathname)) {
    return NextResponse.next();
  }

  // Sesión
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Rol normalizado
  const role = String(token.role || token.user?.role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Admin: acceso total
  if (role === 'administrador') {
    return NextResponse.next();
  }

  // Reglas para otros roles
  for (const rule of ROLE_RULES) {
    if (rule.pattern.test(pathname)) {
      if (!role || !rule.allow.includes(role)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/|favicon.ico|favicon.png|robots.txt|sitemap.xml|login|auth/login|api/auth).*)',
  ],
};

