// lib/firebaseAdmin.ts
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(firebaseAdminConfig),
    });

export const db = getFirestore(app);
