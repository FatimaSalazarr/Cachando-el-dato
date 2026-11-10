const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { JWT } = require('google-auth-library');
const { Storage } = require('@google-cloud/storage');
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
  credential: cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = getFirestore();
const storage = new Storage({
  projectId: serviceAccount.project_id,
  authClient: new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  })
});

module.exports = { db, FieldValue, storage };