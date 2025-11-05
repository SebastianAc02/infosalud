
# InfoSalud

Aplicación para EPS orientada al **seguimiento de pacientes con enfermedades crónicas**. Construida con **Next.js (App Router)**, **Tailwind CSS** y **shadcn/ui**. Incluye autenticación con **NextAuth**, control de **roles** (administrador, médico, auxiliar), reportes con filtros/exportación y gestión básica de pacientes (front-only con `localStorage`).

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
* **Auxiliar**: pacientes y seguimiento.
* Rutas del dashboard protegidas con **NextAuth** y **middleware**.

---

## Reportes y seguimiento

* **Reportes**: filtros por EPS/diagnóstico/sede/médico, toggle “solo no asistidas”, exportación CSV y **resumen mensual** imprimible.
* **Seguimiento**: registro por **SMS / WhatsApp / Llamada** con resultado y notas; opción de **generar alerta temprana**.
* **Adherencia**: se calcula por paciente a partir de **citas pasadas** (asistidas / total).

---

# Despliegue a Producción

**URL pública (ejemplo):** [http://34.10.6.123](http://34.10.6.123)

El proyecto se despliega en una **VM Linux de Google Cloud Platform (GCP)** usando **Docker**. Las actualizaciones se automatizan con **GitHub Actions → DockerHub → Watchtower**.

### 1) Prerrequisitos en la VM (GCP)

* VM con IP estática y puertos abiertos en firewall:

  * **80** (HTTP) y opcional **443** (HTTPS).
* Docker y Docker Compose:

  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  # reinicia sesión
  docker --version
  docker compose version
  ```

### 2) Variables de entorno (producción)

Crea un `.env` junto a `docker-compose.yml` en la VM:

```bash
NEXTAUTH_URL=http://34.10.6.123
NEXTAUTH_SECRET=<tu-secreto-aleatorio>  # p.ej. openssl rand -base64 48
PORT=3000
# SUPABASE_URL=...
# SUPABASE_KEY=...
```

### 3) Dockerfile (ejemplo real del proyecto)

```dockerfile
# Etapa 1: build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: run
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

> (Opcional) Desactiva telemetría de Next con `ENV NEXT_TELEMETRY_DISABLED=1`.

### 4) Probar localmente con Docker

```bash
docker build . --file Dockerfile --tag tuusuario/infosalud:latest
docker run --rm -p 3000:3000 --env-file .env tuusuario/infosalud:latest
# abrir http://localhost:3000
```

### 5) Despliegue en la VM con Docker Compose

Crea `docker-compose.yml`:

```yaml
services:
  infosalud:
    image: TU_DOCKERHUB_USER/infosalud:latest
    container_name: infosalud
    restart: unless-stopped
    env_file: .env
    ports:
      - "80:3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/"]
      interval: 30s
      timeout: 5s
      retries: 3

  watchtower:
    image: containrrr/watchtower:latest
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --cleanup --interval 30 infosalud
```

Levantar/actualizar:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

### 6) CI/CD con GitHub Actions + DockerHub

1. **DockerHub**: crea repo `TU_DOCKERHUB_USER/infosalud` y un **Access Token**.
2. **GitHub Secrets**:

   * `DOCKERHUB_USERNAME` = `TU_DOCKERHUB_USER`
   * `DOCKERHUB_TOKEN` = `<token de DockerHub>`
3. Workflow `.github/workflows/docker.yml`:

   ```yaml
   name: Build & Push Docker image

   on:
     push:
       branches: [ "main" ]
     workflow_dispatch:

   jobs:
     docker:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v4

         - name: Set up Docker Buildx
           uses: docker/setup-buildx-action@v3

         - name: Login to DockerHub
           uses: docker/login-action@v3
           with:
             username: ${{ secrets.DOCKERHUB_USERNAME }}
             password: ${{ secrets.DOCKERHUB_TOKEN }}

         - name: Build & Push
           uses: docker/build-push-action@v6
           with:
             context: .
             push: true
             tags: ${{ secrets.DOCKERHUB_USERNAME }}/infosalud:latest,${{ secrets.DOCKERHUB_USERNAME }}/infosalud:sha-${{ github.sha }}
             platforms: linux/amd64
             build-args: |
               NEXT_TELEMETRY_DISABLED=1
   ```

> Cada push a `main` publica `latest` en DockerHub. **Watchtower** en la VM detecta y actualiza el contenedor automáticamente.

### 7) Operación y mantenimiento

```bash
# estado
docker compose ps
# logs
docker logs -f infosalud
docker logs -f watchtower
# actualizar manualmente
docker compose pull infosalud
docker compose up -d infosalud
# reiniciar
docker compose restart infosalud
# limpiar imágenes huérfanas
docker image prune -f
```

### 8) Accesibilidad y documentación

* La app es accesible en **[http://34.10.6.123](http://34.10.6.123)** (o tu dominio/hostname).
* El contenedor expone **3000** y se publica en **80**.
* Documentado en este **README** y/o **Wiki**: build local, CI/CD, variables, y actualización automática.

---

## Aprende más (Next.js)

Este proyecto partió del template de `create-next-app`. Recursos útiles:

* [Documentación Next.js](https://nextjs.org/docs)
* [Tutorial interactivo](https://nextjs.org/learn)
* [Repositorio Next.js](https://github.com/vercel/next.js)

### Deploy en Vercel

La forma más sencilla es con [Vercel](https://vercel.com).
Guía: [Next.js deployment docs](https://nextjs.org/docs/deployment).

```
