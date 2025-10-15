// file: src/app/(dashboard)/pacientes/[id]/not-found.js
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <h1>Paciente no encontrado</h1>
      <p className="text-sm text-muted-foreground">
        El paciente que buscas no existe o fue removido.
      </p>
      <Button asChild className="mt-2">
        <Link href="/pacientes">Volver a la lista de pacientes</Link>
      </Button>
    </div>
  );
}
