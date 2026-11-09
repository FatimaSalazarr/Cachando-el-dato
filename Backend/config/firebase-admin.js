const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

let serviceAccount;

if (process.env.FIREBASE_CREDENTIALS) {
  // En Vercel, lee exclusivamente desde la variable de entorno
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} else {
  // En local, intenta leer el archivo sin romper el servidor si no existe
  try {
    serviceAccount = require('../../firebase-key.json');
  } catch (error) {
    console.warn("Advertencia: No se encontró firebase-key.json localmente.");
  }
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
module.exports = { db, FieldValue };