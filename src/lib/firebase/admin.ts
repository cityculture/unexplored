import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'city-culture';
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  const serviceAccountFileName = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'city-culture-firebase-adminsdk-fbsvc-82993a91db.json';
  const possiblePaths = [
    path.join(process.cwd(), serviceAccountFileName),
    path.join(process.cwd(), '..', 'backend', serviceAccountFileName),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const fileContent = fs.readFileSync(p, 'utf8');
        const serviceAccount = JSON.parse(fileContent);
        return initializeApp({
          credential: cert(serviceAccount),
        });
      } catch (e) {
        console.error('Failed to parse service account JSON file at:', p, e);
      }
    }
  }

  return initializeApp({
    projectId,
  });
}

const adminApp = initFirebaseAdmin();
export const firebaseAdminAuth = getAuth(adminApp);
