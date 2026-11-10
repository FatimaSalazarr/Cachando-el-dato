const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

let serviceAccount;

if (process.env.FIREBASE_CREDENTIALS) {
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} else {
  const localCredentialsPath = path.join(__dirname, '..', '..', 'firebase-key.json');
  if (fs.existsSync(localCredentialsPath)) {
    serviceAccount = require(localCredentialsPath);
  }
}

if (!serviceAccount) {
  throw new Error('Configura FIREBASE_CREDENTIALS o agrega firebase-key.json para conectar con Firebase.');
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
module.exports = { db, FieldValue };