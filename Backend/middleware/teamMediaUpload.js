const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');

const uploadsDirectory = process.env.VERCEL
  ? path.join(os.tmpdir(), 'cachando-el-dato', 'team-feed')
  : path.join(__dirname, '..', '..', 'uploads', 'team-feed');
fs.mkdirSync(uploadsDirectory, { recursive: true });

const extensionsByType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-m4v': '.m4v',
  'video/x-msvideo': '.avi',
  'video/avi': '.avi',
  'video/x-matroska': '.mkv',
  'video/mpeg': '.mpeg',
  'video/ogg': '.ogv',
  'video/x-flv': '.flv',
  'video/x-ms-wmv': '.wmv',
  'video/x-ms-asf': '.asf',
  'video/mp2t': '.ts',
  'video/3gpp': '.3gp',
  'video/3gpp2': '.3g2'
};

const normalizeMimeType = (mimeType) => mimeType.split(';', 1)[0].trim().toLowerCase();

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDirectory,
    filename: (req, file, callback) => {
      callback(null, `${crypto.randomUUID()}${extensionsByType[normalizeMimeType(file.mimetype)] || ''}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!Object.hasOwn(extensionsByType, normalizeMimeType(file.mimetype))) {
      callback(new Error('Sube una imagen JPG, PNG o WebP, o un video en un formato compatible.'));
      return;
    }
    callback(null, true);
  }
});

const recibirMediaDeEquipo = (req, res, next) => {
  upload.single('media')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const status = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    res.status(status).json({
      error: status === 413
        ? 'El archivo no puede superar los 20 MB.'
        : error.message || 'No se pudo recibir el archivo.'
    });
  });
};

module.exports = { uploadsDirectory, recibirMediaDeEquipo, normalizeMimeType };
