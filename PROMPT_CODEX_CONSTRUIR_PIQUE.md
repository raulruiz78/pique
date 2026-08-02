# Prompt maestro para Codex — Construir Pique

Copia este prompt en Codex junto al fichero `PRODUCT_SPEC_PIQUE.md`.

---

## PROMPT

Actúa como un equipo senior formado por product engineer, arquitecto de software, diseñador de producto, especialista PostgreSQL/Supabase, QA y DevOps. Tu misión es construir de extremo a extremo el MVP de **Pique**, descrito en el archivo `PRODUCT_SPEC_PIQUE.md` que se encuentra en este repositorio.

No quiero un prototipo estático ni una colección de pantallas. Quiero una aplicación funcional, segura, desplegable y mantenible, con frontend, backend, base de datos, autenticación, storage privado, lógica de negocio, tests, datos demo, CI y documentación de despliegue.

### 1. Forma de trabajo

1. Lee completamente `PRODUCT_SPEC_PIQUE.md` antes de modificar nada y úsalo como fuente de verdad.
2. Inspecciona el repositorio, las instrucciones locales (`AGENTS.md`, `README`, configuración existente) y conserva cambios del usuario no relacionados.
3. Si el repositorio está vacío, inicialízalo. Si ya existe, integra la solución sin reescribir innecesariamente.
4. Crea un plan por hitos y ejecútalo hasta terminar. No te detengas después de generar el esqueleto.
5. Toma decisiones razonables de implementación por tu cuenta. Solo pregunta si falta una credencial, permiso o decisión realmente bloqueante.
6. Usa versiones estables actuales y compatibles. Verifica la documentación oficial cuando una API, CLI o configuración pueda haber cambiado.
7. Después de cada hito, ejecuta las comprobaciones relevantes y corrige los fallos antes de avanzar.
8. No declares terminada una función que solo tenga UI simulada o datos hardcodeados, salvo que esté explícitamente marcada como demo.
9. No expongas secretos ni incluyas credenciales reales en el repositorio.
10. Al final, entrega un resumen exacto de lo construido, comandos ejecutados, resultados de tests, decisiones pendientes y pasos de despliegue.

### 2. Stack y arquitectura obligatorios

- Monorepo con `pnpm` workspaces.
- Next.js App Router, React y TypeScript con modo estricto.
- Tailwind CSS y componentes accesibles basados en Radix UI o shadcn/ui.
- Zod para validación compartida y React Hook Form para formularios.
- PostgreSQL con Supabase para Auth, Database, Storage y Realtime.
- Arquitectura de monolito modular con capas `presentation`, `application`, `domain` e `infrastructure`.
- Lógica de dominio independiente de React y de Supabase siempre que sea razonable.
- Vitest para unitarios/integración y Playwright para E2E.
- ESLint, Prettier y comprobación TypeScript.
- CI en GitHub Actions.
- Despliegue principal documentado para Vercel + Supabase.

Puedes añadir dependencias justificadas, pero evita complejidad gratuita, microservicios y abstracciones prematuras.

### 3. Estructura objetivo

Adapta los detalles cuando Next.js o las herramientas lo requieran, conservando esta separación:

```text
pique/
├── apps/web/
├── packages/domain/
├── packages/database/
├── packages/validation/
├── packages/ui/
├── packages/config/
├── supabase/migrations/
├── supabase/functions/
├── supabase/seed.sql
├── tests/integration/
├── tests/e2e/
├── docs/architecture/
├── docs/deployment/
├── .github/workflows/ci.yml
├── .env.example
├── README.md
└── pnpm-workspace.yaml
```

### 4. Funcionalidad que debes implementar

Implementa los criterios de aceptación del Product Specification y, como mínimo:

- Autenticación, sesión, recuperación y onboarding de perfil.
- Perfiles con alias, avatar, zona horaria y preferencias.
- Círculos privados con miembros, roles e invitación por código/enlace.
- Creación de retos mediante flujo guiado: plantilla, participantes, fechas, recurrencia, puntos, evidencia, validación y castigo/recompensa.
- Aceptación, rechazo, programación, activación, cancelación y finalización de retos con transiciones válidas.
- Objetivos y generación de ocurrencias mediante RRULE o formato compatible.
- Pantalla “Hoy” y calendario semanal/mensual.
- Check-ins con nota, valor y evidencia fotográfica privada.
- Autovalidación y peer review con aprobación, rechazo y disputa preparada.
- Ledger de puntos idempotente; el cliente nunca envía la puntuación final.
- Ranking por reto y círculo, rachas y desempate determinista.
- Feed básico y notificaciones in-app.
- Realtime solo donde aporte valor: ranking, validaciones y feed.
- Castigos/recompensas sin dinero y con avisos de seguridad.
- Preferencias, privacidad, bloqueo y denuncia básica.
- Manifest PWA, iconos, service worker y experiencia instalable.
- Cola local opcional para preparar check-ins offline; los puntos solo se aplican tras confirmación del servidor.
- Datos semilla coherentes con dos usuarios, un círculo, varios retos, ocurrencias, check-ins y ranking.

Si una integración externa opcional —push, email, Sentry o PostHog— no tiene credenciales, crea un adaptador real, una implementación no-op para local, variables documentadas y una guía para activarla. No bloquees el núcleo del MVP por estas integraciones.

### 5. Diseño y UX

Diseña una interfaz mobile-first juvenil, competitiva y cercana, sin aspecto infantil ni de plantilla genérica.

- Navegación inferior: Inicio, Calendario, botón central de crear, Ranking y Perfil.
- Titulares con personalidad, tarjetas redondeadas, avatares prominentes y jerarquía visual clara.
- Paleta principal morado eléctrico con acentos lima/coral; verde completado, ámbar pendiente, rojo riesgo y dorado primero.
- Tema claro y oscuro.
- Microinteracciones sutiles y `prefers-reduced-motion`.
- Feedback claro para carga, vacío, error, sin conexión, éxito y permisos insuficientes.
- Accesibilidad WCAG AA, foco visible, teclado, labels y objetivos táctiles de al menos 44 px.
- El flujo de check-in debe poder completarse con pocos toques.

Incluye contenido realista en español; evita lorem ipsum. La aplicación debe verse cuidada tanto en 390 px de ancho como en escritorio.

### 6. Base de datos, RLS y seguridad

Crea migraciones SQL versionadas, índices, constraints, funciones y políticas RLS. Incluye las tablas descritas en el Product Specification y cualquier tabla auxiliar necesaria.

Requisitos críticos:

- Privado por defecto.
- Un usuario solo ve círculos y retos autorizados.
- Las evidencias usan buckets privados y URLs firmadas temporales.
- Las operaciones sensibles se ejecutan en servidor.
- `score_transactions` funciona como ledger con unicidad por fuente y razón.
- Usa transacciones, idempotency keys y control de versiones para concurrencia.
- Registra hora del servidor; no confíes en timestamps, roles, user IDs ni puntos proporcionados por cliente.
- Valida payloads en servidor con Zod.
- Aplica límites de tamaño/tipo a imágenes y evita paths manipulables.
- Añade rate limiting razonable o un adaptador documentado según el entorno.
- Configura cabeceras de seguridad y CSP compatible con Supabase.
- Sanitiza logs: nunca tokens, contraseñas, evidencias, secretos o URLs firmadas completas.

Incluye pruebas automáticas de RLS o integración que demuestren que un usuario ajeno no puede acceder a círculos, retos ni evidencias.

### 7. Motor de dominio

Implementa y prueba como módulos puros:

- Máquina de estados del reto.
- Recurrencias y generación de ocurrencias para horizonte de 30 días.
- Ventanas y caducidad de check-in.
- Puntuación base, bonus, penalizaciones e idempotencia.
- Rachas.
- Ranking y reglas de desempate.
- Finalización de reto, ganador, posiciones y consecuencia.
- Validación y transiciones de check-in.

Usa un patrón outbox o equivalente para que guardar el hecho de dominio y publicar efectos secundarios sea consistente. Crea jobs idempotentes para generar ocurrencias, caducar elementos, finalizar retos, procesar outbox y recordatorios. Documenta cómo se ejecutan en local y en producción.

### 8. API y manejo de errores

Implementa una API coherente bajo `/api/v1` o Server Actions con contratos equivalentes. Mantén una respuesta de error uniforme:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensaje seguro para el usuario",
    "details": {},
    "requestId": "..."
  }
}
```

Añade autorización por recurso, validación, paginación por cursor donde corresponda e idempotencia en mutaciones repetibles. Documenta los contratos principales en `docs/architecture/API.md` con ejemplos de request, response y errores.

### 9. Tests obligatorios

Crea y ejecuta:

- Unitarios para puntuación, rachas, recurrencias, desempates y máquinas de estado.
- Integración para crear/aceptar reto, generar ocurrencias, check-in, validación, ledger y outbox.
- Seguridad/RLS para accesos autorizados y denegados.
- E2E con Playwright para el camino crítico completo entre dos usuarios.
- Pruebas de componentes o accesibilidad en los flujos principales cuando sean útiles.

El escenario E2E esencial es:

> A crea círculo y reto → B se une y acepta → A hace check-in con evidencia → B valida → se asignan puntos una sola vez → cambia el ranking → finaliza el reto → se determina ganador y castigo.

No elimines ni relajes tests para hacer pasar la suite. Corrige la causa. Si una prueba que requiere servicio externo no puede ejecutarse en el entorno disponible, deja un modo local reproducible, ejecútala cuando sea posible y documenta exactamente la limitación.

### 10. Experiencia local y datos demo

El proyecto debe poder levantarse desde cero siguiendo el README.

Incluye:

- Versiones requeridas de Node y pnpm.
- `.env.example` completo y comentado.
- Supabase CLI y `supabase start` para desarrollo local.
- Comandos para instalar, migrar, sembrar, desarrollar, probar y construir.
- Usuarios demo y credenciales exclusivamente locales claramente marcadas.
- Seed idempotente o reiniciable.
- Adaptadores no-op para integraciones opcionales.
- Script de verificación o smoke test.

Objetivo de inicio rápido:

```bash
pnpm install
supabase start
pnpm db:reset
pnpm dev
```

Si los comandos reales deben ser distintos, documenta los definitivos y asegúrate de que funcionan.

### 11. CI/CD

Crea `.github/workflows/ci.yml` con cache apropiada y estos pasos:

1. Instalación reproducible con lockfile.
2. Formato/lint.
3. Typecheck.
4. Tests unitarios e integración.
5. Build de producción.
6. E2E o workflow separado cuando requiera servicios.

No hagas despliegues automáticos sin credenciales, pero documenta cómo activar previews de Vercel, protección de ramas y migraciones seguras.

### 12. Documentación de despliegue obligatoria

Crea `docs/deployment/DEPLOYMENT.md` suficientemente preciso para que otra persona despliegue sin preguntarte nada. Debe incluir, en orden:

1. Requisitos y cuentas necesarias.
2. Creación y configuración del proyecto Supabase.
3. Aplicación de migraciones y seed opcional.
4. Configuración de Auth, URLs de redirección y proveedores OAuth opcionales.
5. Creación del bucket privado, límites y políticas.
6. Activación de Realtime solo para las tablas necesarias.
7. Variables de entorno, indicando cuáles son públicas y cuáles secretas.
8. Creación del proyecto Vercel, root directory, build command y output.
9. Conexión de dominios y callbacks.
10. Configuración de cron/jobs con secreto de protección.
11. Activación opcional de push, email, Sentry y PostHog.
12. Estrategia de migraciones entre preview y producción.
13. Smoke tests posteriores al despliegue.
14. Logs, alertas, backups y restauración.
15. Rollback de aplicación y base de datos.
16. Checklist final de producción y estimación de costes iniciales, dejando claro que los precios deben verificarse en las páginas oficiales actuales.

Incluye también `docs/deployment/LOCAL.md` y una tabla completa de variables en `docs/deployment/ENVIRONMENT.md`. No incluyas valores secretos.

### 13. Entregables

Antes de terminar deben existir y estar completos:

- Código fuente del frontend y backend.
- Migraciones, RLS, índices, funciones y seed.
- Assets mínimos de la PWA.
- Tests y configuración de CI.
- `.env.example`.
- `README.md` con quickstart.
- `docs/architecture/ARCHITECTURE.md`.
- `docs/architecture/API.md`.
- `docs/architecture/DECISIONS.md` con ADRs principales.
- `docs/deployment/LOCAL.md`.
- `docs/deployment/ENVIRONMENT.md`.
- `docs/deployment/DEPLOYMENT.md`.
- `docs/SECURITY.md` y `docs/PRIVACY.md`.
- `CHANGELOG.md` con la versión inicial.

### 14. Definition of Done

No des la tarea por terminada hasta que:

- Los 14 criterios de aceptación del Product Specification estén implementados o exista una justificación explícita y concreta para cualquier excepción.
- La aplicación use datos reales de la base de datos y no mocks en los flujos de producción.
- Lint, formato, TypeScript, unitarios, integración y build pasen.
- El E2E crítico pase en un entorno local reproducible o quede documentado el único bloqueo externo verificable.
- Las políticas RLS tengan pruebas negativas.
- La PWA sea instalable y responsive.
- No haya secretos en Git ni errores críticos conocidos.
- La documentación local y de despliegue haya sido comprobada contra el repositorio real.

### 15. Informe final que debes devolverme

Al terminar, responde con:

1. Resumen de funcionalidades construidas.
2. Arquitectura final y decisiones importantes.
3. Archivos y documentación principales.
4. Comandos de desarrollo y pruebas.
5. Resultado exacto de cada comprobación ejecutada.
6. Pasos resumidos para desplegar.
7. Variables o credenciales que debo aportar.
8. Limitaciones reales, deuda técnica y siguiente hito recomendado.

Empieza ahora: lee la especificación, inspecciona el repositorio, presenta un plan breve y construye el MVP completo hasta dejarlo listo para desplegar.

---

## Fin del prompt
