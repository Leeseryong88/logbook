import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const initAdmin = () => {
  if (getApps().length) return;

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return;
  }

  initializeApp({
    credential: applicationDefault(),
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const nameParam = req.query.name;
  const displayName =
    (Array.isArray(nameParam) ? nameParam[0] : nameParam)?.trim() ?? '';

  if (!displayName) {
    res.status(400).json({ error: 'name_required' });
    return;
  }

  try {
    initAdmin();
    const db = getFirestore();
    const snapshot = await db
      .collection('users')
      .where('displayName', '==', displayName)
      .limit(1)
      .get();

    res.status(200).json({ available: snapshot.empty });
  } catch (error) {
    console.error('[api/check-nickname] failed', error);
    res.status(500).json({ error: 'internal_error' });
  }
}

