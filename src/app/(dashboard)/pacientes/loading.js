// file: src/app/(dashboard)/pacientes/loading.js
export default function PacientesLoading() {
  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="space-y-2">
        <div className="h-7 w-56 bg-muted rounded animate-pulse" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse" />
      </div>

      {/* Card: búsqueda + tabla */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <div className="h-5 w-28 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-60 bg-muted rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-4">
          {/* Input búsqueda */}
          <div className="h-10 w-[32rem] max-w-full bg-muted rounded animate-pulse" />
          {/* Tabla */}
          <div className="rounded-lg border overflow-hidden">
            <div className="h-10 bg-muted/50" />
            <div className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-background animate-pulse" />
              ))}
            </div>
          </div>
          {/* Paginación */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-muted rounded animate-pulse" />
              <div className="h-9 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
