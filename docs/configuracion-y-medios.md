# Configuración de variables y multimedia

## Variables de entorno

El archivo `.env` se usa al ejecutar el servidor localmente. En Vercel, configura las variables en **Project → Settings → Environment Variables** y vuelve a desplegar la aplicación después de guardarlas.

| Variable | Para qué sirve | Dónde obtenerla |
| --- | --- | --- |
| `GNEWS_API_KEY` | Activa las noticias de béisbol. Es opcional. | Una API key de GNews. |
| `FIREBASE_STORAGE_BUCKET` | Guarda las fotos y videos de la comunidad en almacenamiento persistente. | Firebase Console → Storage; copia el nombre exacto del bucket. |
| `FIREBASE_CREDENTIALS` | Permite al servidor conectarse con Firestore y Firebase Storage en Vercel. | Firebase Console → Project settings → Service accounts → genera una clave privada y guarda el JSON completo como el valor de esta variable. |

No agregues estas claves al código ni a archivos versionados. `FIREBASE_CREDENTIALS` debe ser el JSON completo de la cuenta de servicio, no una URL ni una clave del cliente web. En local, el servidor también puede usar el archivo ignorado `firebase-key.json`.

Ejemplo de `.env` local (usa tus propios valores, no los de ejemplo):

```dotenv
GNEWS_API_KEY=tu-api-key-de-gnews
FIREBASE_STORAGE_BUCKET=nombre-exacto-del-bucket
```

En Vercel, agrega las variables al entorno **Production** (y a Preview/Development si los usas). El bucket tiene que pertenecer al mismo proyecto de Firebase que las credenciales, y la cuenta de servicio necesita acceso a Firestore y permiso para escribir en el bucket.

## Publicaciones antiguas subidas localmente

Las publicaciones antiguas pueden tener una URL `/uploads/team-feed/...`. Esa carpeta es local y no se conserva en Vercel. Primero configura `FIREBASE_STORAGE_BUCKET` y las credenciales de Firebase en tu entorno local, confirma que los archivos originales sigan en `uploads/team-feed`, y ejecuta:

```powershell
npm run migrate:local-media
```

El comando sube los archivos encontrados a Firebase Storage y actualiza sus documentos de Firestore. Es idempotente para los documentos ya migrados. Los archivos que ya no estén en la carpeta local se reportan y tendrán que volver a subirse desde la aplicación.
