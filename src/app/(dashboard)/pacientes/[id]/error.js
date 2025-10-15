// file: src/app/(dashboard)/pacientes/[id]/error.js
'use client';

import { Button } from '@/components/ui/button';

export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <h1>Ocurrió un error</h1>
      <p className="text-sm text-muted-foreground max-w-prose">
        {error?.message || 'Algo salió mal al cargar la ficha del paciente.'}
      </p>
      <Button onClick={() => reset()} className="mt-2">
        Reintentar
      </Button>
    </div>
  );
}
