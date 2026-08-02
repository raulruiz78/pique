# Versionado y releases

Pique usa versionado semántico (`MAJOR.MINOR.PATCH`) y GitHub como fuente de verdad de cada despliegue.

## Flujo normal

1. Crear una rama `agent/descripcion` desde `main`.
2. Abrir un PR hacia `main`.
3. Esperar `quality`, `database-and-e2e` y la preview de Vercel.
4. Fusionar mediante squash. Vercel despliega `main` y Supabase aplica migraciones nuevas.
5. Verificar producción y sincronizar el mismo árbol con `develop`.
6. Cuando el conjunto merezca una versión, actualizar `version` en `package.json`, `apps/web/package.json` y `CHANGELOG.md` dentro del PR.
7. Ejecutar **Actions → Release → Run workflow** desde `main`, indicando la versión sin `v`, por ejemplo `0.2.0`.

El workflow comprueba que la versión solicitada coincide con el código de `main`, evita etiquetas duplicadas y crea la etiqueta y GitHub Release sobre el commit exacto ya desplegado.

## Criterio de versión

- `PATCH`: corrección compatible sin funcionalidad nueva.
- `MINOR`: funcionalidad nueva compatible.
- `MAJOR`: cambio incompatible en API, datos o experiencia principal.

Las migraciones de base de datos nunca se revierten borrando archivos aplicados. Un rollback de aplicación usa un deployment anterior de Vercel; un rollback de esquema se hace mediante una nueva migración correctiva.
