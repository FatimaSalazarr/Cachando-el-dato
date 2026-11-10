require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { getStorage } = require('firebase-admin/storage');
const { uploadsDirectory } = require('../Backend/middleware/teamMediaUpload');

const TEAM_KEYS = ['ace', 'alg', 'cal', 'cha', 'dor', 'rie', 'soc', 'sul', 'tec', 'tor'];
const MEDIA_COLLECTIONS = [
  { collection: 'teamFeed', destination: 'team-feed' },
  { collection: 'teamGallery', destination: 'team-gallery' }
];
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const getLegacyFilename = (mediaUrl) => {
  if (typeof mediaUrl !== 'string') return null;
  const pathname = new URL(mediaUrl, 'http://localhost').pathname;
  const prefix = '/uploads/team-feed/';
  if (!pathname.startsWith(prefix)) return null;

  const filename = decodeURIComponent(pathname.slice(prefix.length));
  if (!filename || path.basename(filename) !== filename) {
    throw new Error(`Ruta local de multimedia no válida: ${pathname}`);
  }
  return filename;
};

async function migrateLocalMedia() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    throw new Error('Configura FIREBASE_STORAGE_BUCKET antes de migrar las imágenes.');
  }

  const { db } = require('../Backend/config/firebase-admin');
  const bucket = getStorage().bucket(bucketName);
  let migrated = 0;
  let missing = 0;

  for (const { collection, destination } of MEDIA_COLLECTIONS) {
    for (const teamKey of TEAM_KEYS) {
      const snapshot = await db.collection(collection)
        .doc(teamKey)
        .collection('publicaciones')
        .get();

      for (const publication of snapshot.docs) {
        const data = publication.data();
        const filename = getLegacyFilename(data.mediaUrl);
        if (!filename) continue;

        const localPath = path.join(uploadsDirectory, filename);
        try {
          await fs.access(localPath);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
          console.warn(`No se encontró el archivo local ${filename}; se omite ${publication.ref.path}.`);
          missing += 1;
          continue;
        }

        const extension = path.extname(filename).toLowerCase();
        const contentType = MIME_TYPES[extension];
        if (!contentType) {
          throw new Error(`Formato no compatible para migración: ${filename}`);
        }

        const storagePath = `${destination}/${teamKey}/legacy-${publication.id}${extension}`;
        const downloadToken = crypto.randomUUID();
        const storageFile = bucket.file(storagePath);

        try {
          await pipeline(
            fsSync.createReadStream(localPath),
            storageFile.createWriteStream({
              resumable: false,
              metadata: {
                contentType,
                metadata: { firebaseStorageDownloadTokens: downloadToken }
              }
            })
          );
          await publication.ref.update({
            mediaUrl: `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`,
            storagePath,
            mimeType: contentType
          });
        } catch (error) {
          try {
            await storageFile.delete({ ignoreNotFound: true });
          } catch (cleanupError) {
            console.error(`No se pudo limpiar ${storagePath} después de un error:`, cleanupError);
          }
          throw error;
        }

        migrated += 1;
        console.log(`Migrada ${publication.ref.path}.`);
      }
    }
  }

  console.log(`Migración terminada: ${migrated} archivos migrados; ${missing} archivos locales no encontrados.`);
  if (missing > 0) process.exitCode = 1;
}

migrateLocalMedia().catch((error) => {
  console.error('No se pudo completar la migración de multimedia:', error);
  process.exitCode = 1;
});
