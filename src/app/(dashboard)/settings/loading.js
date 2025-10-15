// file: src/app/(dashboard)/settings/loading.js
export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Perfil */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-60 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>

        {/* Recordatorios */}
        <div className="rounded-lg border bg-card p-6 space-y-4 lg:col-span-2">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted rounded animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-muted rounded animate-pulse" />
          ))}
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-full bg-muted rounded animate-pulse" />
            ))}
          </div>
          <div className="flex justify-end">
            <div className="h-9 w-40 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Preferencias de contacto del paciente */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="h-5 w-72 bg-muted rounded animate-pulse" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="flex justify-end">
          <div className="h-9 w-56 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Gestión de usuarios */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse" />
        <div className="h-9 w-40 bg-muted rounded animate-pulse" />
        <div className="h-48 w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
