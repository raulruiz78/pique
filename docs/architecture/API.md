# API v1

Todas las respuestas correctas tienen `{ "data": ... }`. Los errores usan:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisa los datos enviados.",
    "details": {},
    "requestId": "uuid"
  }
}
```

Las sesiones viajan en cookies seguras gestionadas por `@supabase/ssr`. Las mutaciones repetibles exigen `Idempotency-Key`.

| Método    | Ruta                                   | Uso                         |
| --------- | -------------------------------------- | --------------------------- |
| GET/POST  | `/api/v1/circles`                      | listar o crear círculos     |
| POST      | `/api/v1/circles/{id}/invites`         | crear enlace temporal       |
| POST      | `/api/v1/circle-invites/{code}/accept` | unirse                      |
| GET/POST  | `/api/v1/challenges`                   | listar o crear/publicar     |
| POST      | `/api/v1/challenges/{id}/respond`      | aceptar o rechazar          |
| POST      | `/api/v1/evidence/uploads`             | URL firmada de subida       |
| POST      | `/api/v1/occurrences/{id}/check-ins`   | registrar cumplimiento      |
| POST      | `/api/v1/check-ins/{id}/review`        | aprobar o rechazar          |
| GET/PATCH | `/api/v1/users/me`                     | perfil                      |
| GET/PATCH | `/api/v1/notifications`                | bandeja y lectura           |
| POST      | `/api/v1/reports`                      | denuncia básica             |
| POST      | `/api/v1/users/{id}/block`             | bloqueo                     |
| POST      | `/api/v1/cron/maintenance`             | expiración, cierre y outbox |

Ejemplo de check-in:

```http
POST /api/v1/occurrences/uuid/check-ins
Content-Type: application/json
Idempotency-Key: 2bd5...

{"note":"Entreno terminado","evidence":{"storagePath":"user/occurrence/file.webp","mimeType":"image/webp","sizeBytes":84211,"sha256":"...64 hex..."}}
```

El cliente solicita primero una URL de subida. El servidor confirma propietario, estado, tipo y tamaño; la función SQL vuelve a comprobar path y requisito de evidencia.
