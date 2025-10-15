# InfoSalud

Aplicación para EPS orientada al **seguimiento de pacientes con enfermedades crónicas**. Construida con **Next.js (App Router)**, **Tailwind CSS** y **shadcn/ui**. Incluye autenticación con **NextAuth**, control de **roles** (administrador, médico, auxiliar), reportes con filtros/exportación y gestión básica de pacientes (front-only con localStorage).

---

## Requisitos

- **Node.js** 18.17+ (recomendado 20+)
- **npm** 9/10+
- Archivo de entorno: **`.env.local`**

Ejemplo mínimo:
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secreto-aleatorio
````

---

## Empezar (desarrollo)

Instala dependencias e inicia el servidor:

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la app.

> La app usa el **App Router** en `src/app`. Puedes editar páginas como `src/app/(dashboard)/page.js`; la página se actualiza en caliente.

---

## Scripts útiles

```bash
npm run dev      # desarrollo
npm run build    # build de producción
npm run start    # servir producción después de build
npm run lint     # linting
```

---

## UI y estilos

* **Tailwind CSS** (ver `tailwind.config.js` y `src/app/globals.css`)
* **shadcn/ui** en `src/components/ui/*` (botones, inputs, cards, tablas, etc.)
* Paleta y tokens accesibles via `:root` en `globals.css`

---

## Roles y acceso

* **Administrador**: acceso total (gestión de usuarios, configuración, reportes, etc.)
* **Médico**: pacientes, reportes, registrar asistencia y seguimiento
* **Auxiliar**: pacientes y seguimiento; **no** registra asistencia
* Rutas del dashboard protegidas con **NextAuth** y **middleware**.

---

## Reportes y seguimiento

* **Reportes**: filtros por EPS/diagnóstico/sede/médico, toggle “solo no asistidas”, exportación CSV y **resumen mensual** imprimible.
* **Seguimiento**: registro por **SMS / WhatsApp / Llamada** con resultado y notas; opción de **generar alerta temprana**.
* **Adherencia**: se calcula por paciente a partir de **citas pasadas** (asistidas / total).

---

## Aprende más (Next.js)

Este proyecto partió del template de `create-next-app`. Recursos útiles:

* [Documentación Next.js](https://nextjs.org/docs)
* [Tutorial interactivo](https://nextjs.org/learn)
* [Repositorio Next.js](https://github.com/vercel/next.js)

### Deploy en Vercel

La forma más sencilla es con [Vercel](https://vercel.com).
Guía: [Next.js deployment docs](https://nextjs.org/docs/deployment).
