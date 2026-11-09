const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Usa la variable de entorno en Vercel, o el archivo local en tu computadora
let serviceAccount;
if (process.env.FIREBASE_CREDENTIALS) {
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} else {
  serviceAccount = require('../../firebase-key.json');
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
module.exports = { db, FieldValue };