import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    firebaseConfig = JSON.parse(fileContent);
  } else {
    console.warn('firebase-applet-config.json not found, using default app credentials');
  }
} catch (error) {
  console.error('Error reading firebase-applet-config.json:', error);
}

const apps = getApps();
if (!apps.length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

export const adminDb = getFirestore();
export const adminStorage = getStorage();
