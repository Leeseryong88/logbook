import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type ServiceAccountEnv = {
  project_id: string;
  client_email: string;
  private_key: string;
};

const decodeServiceAccount = (): ServiceAccountEnv | null => {
  const inline = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (inline) {
    try {
      const parsed = JSON.parse(inline) as ServiceAccountEnv;
      if (parsed?.project_id && parsed?.client_email && parsed?.private_key) {
        return parsed;
      }
    } catch {
      try {
        const decoded = Buffer.from(inline, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded) as ServiceAccountEnv;
        if (parsed?.project_id && parsed?.client_email && parsed?.private_key) {
          return parsed;
        }
      } catch {
        console.warn('[api/check-nickname] Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT');
      }
    }
  }
  return null;
};

const initAdmin = () => {
  if (getApps().length) {
    return;
  }

  const serviceAccount = decodeServiceAccount();
  if (serviceAccount) {
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }),
    });
    return;
  }

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
    const message =
      error instanceof Error ? error.message : 'internal_error';
    res.status(500).json({ error: message });
  }
}

export const config = {
  runtime: 'nodejs18.x',
};

