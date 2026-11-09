const crypto = require('crypto');
const fsSync = require('fs');
const fs = require('fs/promises');
const path = require('path');
const { pipeline } = require('stream/promises');
const { getStorage } = require('firebase-admin/storage');
const { db, FieldValue } = require('../config/firebase-admin');
const { uploadsDirectory, normalizeMimeType } = require('../middleware/teamMediaUpload');

const TEAM_KEYS = new Set(['ace', 'alg', 'cal', 'cha', 'dor', 'rie', 'soc', 'sul', 'tec', 'tor']);
const FILTERS = new Set(['none', 'blur', 'sparkles', 'thermal', 'saturate']);
const MIME_PREFIXES = {
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/webp': Buffer.from('RIFF'),
  'video/mp4': Buffer.from('ftyp'),
  'video/webm': Buffer.from([0x1a, 0x45, 0xdf, 0xa3])
};
const FILE_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm'
};

const removeUploadedFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('No se pudo limpiar un archivo multimedia:', error);
    }
  }
};

const uploadMedia = async (file, teamKey, mimeType) => {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    if (process.env.VERCEL) {
      const error = new Error('Configura FIREBASE_STORAGE_BUCKET con el nombre del bucket de Firebase Storage.');
      error.status = 503;
      throw error;
    }

    return {
      mediaUrl: `/uploads/team-feed/${path.basename(file.filename)}`,
      storagePath: null
    };
  }

  const bucket = getStorage().bucket(bucketName);
  const storagePath = `team-feed/${teamKey}/${crypto.randomUUID()}${FILE_EXTENSIONS[mimeType]}`;
  const downloadToken = crypto.randomUUID();
  const storageFile = bucket.file(storagePath);
  await pipeline(
    fsSync.createReadStream(file.path),
    storageFile.createWriteStream({
      resumable: false,
      metadata: {
        contentType: mimeType,
        metadata: { firebaseStorageDownloadTokens: downloadToken }
      }
    })
  );

  return {
    mediaUrl: `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`,
    storagePath
  };
};

const removeStoredMedia = async (storagePath) => {
  if (!storagePath || !process.env.FIREBASE_STORAGE_BUCKET) return;
  try {
    await getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET).file(storagePath).delete({ ignoreNotFound: true });
  } catch (error) {
    console.error('No se pudo limpiar el archivo de Firebase Storage:', error);
  }
};

const validarEquipoFeed = (req, res, next) => {
  if (!TEAM_KEYS.has(req.params.teamKey)) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }
  return next();
};

const validarTipoReal = async (file) => {
  const handle = await fs.open(file.path, 'r');
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    const mimeType = normalizeMimeType(file.mimetype);
    const prefix = MIME_PREFIXES[mimeType];
    if (!prefix || bytesRead < prefix.length || !header.subarray(0, prefix.length).equals(prefix)) {
      return false;
    }
    if (mimeType === 'image/webp') {
      return header.toString('ascii', 8, 12) === 'WEBP';
    }
    if (mimeType === 'video/mp4') {
      return header.toString('ascii', 4, 8) === 'ftyp';
    }
    return true;
  } finally {
    await handle.close();
  }
};

const serializarPublicacion = (doc) => {
  const data = doc.data();
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(0);
  return {
    id: doc.id,
    teamKey: data.teamKey,
    mediaUrl: data.mediaUrl,
    type: data.type,
    filter: data.filter,
    caption: data.caption || '',
    username: data.username || 'Aficionado',
    createdAt: createdAt.toISOString()
  };
};

const obtenerFeedEquipo = async (req, res) => {
  const { teamKey } = req.params;
  if (!TEAM_KEYS.has(teamKey)) {
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }

  try {
    const snapshot = await db.collection('teamFeed')
      .doc(teamKey)
      .collection('publicaciones')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const publicaciones = snapshot.docs.map(serializarPublicacion);

    return res.json({ publicaciones });
  } catch (error) {
    console.error('Error al cargar el feed del equipo:', error);
    return res.status(500).json({ error: 'No se pudo cargar el feed del equipo.' });
  }
};

const publicarMediaEquipo = async (req, res) => {
  const { teamKey } = req.params;
  const file = req.file;

  if (!TEAM_KEYS.has(teamKey)) {
    if (file) await removeUploadedFile(file.path);
    return res.status(404).json({ error: 'Equipo no encontrado.' });
  }
  if (!file) {
    return res.status(400).json({ error: 'Selecciona una foto o un video.' });
  }

  let storagePath;
  try {
    if (!(await validarTipoReal(file))) {
      await removeUploadedFile(file.path);
      return res.status(400).json({ error: 'El contenido del archivo no coincide con su formato.' });
    }

    const caption = typeof req.body.caption === 'string' ? req.body.caption.trim().slice(0, 180) : '';
    const filter = typeof req.body.filter === 'string' && FILTERS.has(req.body.filter)
      ? req.body.filter
      : 'none';
    const mimeType = normalizeMimeType(file.mimetype);
    const storedMedia = await uploadMedia(file, teamKey, mimeType);
    storagePath = storedMedia.storagePath;
    await removeUploadedFile(file.path);
    const userDoc = await db.collection('usuarios').doc(req.usuario.id).get();
    const username = userDoc.exists ? userDoc.data().username : 'Aficionado';
    const mediaUrl = storedMedia.mediaUrl;
    const publicationRef = await db.collection('teamFeed')
      .doc(teamKey)
      .collection('publicaciones')
      .add({
        teamKey,
        userId: req.usuario.id,
        username,
        mediaUrl,
        storagePath: storedMedia.storagePath,
        type: mimeType.startsWith('video/') ? 'video' : 'image',
        mimeType,
        filter,
        caption,
        createdAt: FieldValue.serverTimestamp()
      });

    return res.status(201).json({
      publicacion: {
        id: publicationRef.id,
        teamKey,
        mediaUrl,
        type: mimeType.startsWith('video/') ? 'video' : 'image',
        filter,
        caption,
        username,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    await removeUploadedFile(file.path);
    await removeStoredMedia(storagePath);
    if (error.status === 503) {
      return res.status(503).json({ error: error.message });
    }
    console.error('Error al publicar media del equipo:', error);
    return res.status(500).json({ error: 'No se pudo publicar el archivo en el feed.' });
  }
};

module.exports = { obtenerFeedEquipo, publicarMediaEquipo, validarEquipoFeed };
