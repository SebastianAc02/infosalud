// file: src/app/(auth)/login/page.js
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, UserPlus, LogIn, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import toast from 'react-hot-toast';

const isEpsEmail = (email) => String(email || '').trim().toLowerCase().endsWith('@eps.test');

export default function AuthPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('from') || '/';

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const onLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });
      if (res?.ok) {
        router.push(res.url || callbackUrl);
      } else {
        toast.error('Credenciales inválidas');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    if (!isEpsEmail(email)) {
      toast.error('Solo aceptamos correos @eps.test');
      return;
    }
    if (!name.trim()) {
      toast.error('Ingresa tu nombre');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== password2) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      // “Registro” por ahora
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        name,         // se usará si no existe el usuario demo
        callbackUrl,
      });
      if (res?.ok) {
        toast.success('Cuenta creada');
        router.push(res.url || callbackUrl);
      } else {
        toast.error('No se pudo crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[hsl(var(--background))] px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">InfoSalud 🩺</span>
          </div>
          <CardTitle className="text-2xl">{mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Accede con tu correo y contraseña.'
              : 'Regístrate con un correo corporativo @eps.test.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={mode === 'login' ? onLogin : onRegister}>
            {mode === 'register' && (
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Tu nombre y apellido"
                    className="pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Correo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={mode === 'register' ? 'tuname@eps.test' : 'correo@eps.test'}
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              {mode === 'register' && (
                <p className="text-xs text-muted-foreground">Solo aceptamos correos con sufijo <span className="font-medium">@eps.test</span>.</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="grid gap-2">
                <Label htmlFor="password2">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password2"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {mode === 'login' ? (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrarme
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-primary hover:underline underline-offset-4"
                >
                  Crear cuenta
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary hover:underline underline-offset-4"
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
