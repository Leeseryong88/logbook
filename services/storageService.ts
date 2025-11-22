import { DiveLog, Badge, DiveType } from "../types";
import { db, storage } from "./firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadString,
} from "firebase/storage";

// Predefined badges with checking logic
export const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'first-splash',
    name: '첫 입수',
    description: '첫 번째 다이빙 로그를 기록했습니다.',
    icon: '🤿',
    condition: (logs) => logs.length >= 1
  },
  {
    id: 'first-step',
    name: '오픈워터',
    description: '다이빙 로그 4회를 기록했습니다.',
    icon: '🥉',
    condition: (logs) => logs.length >= 4
  },
  {
    id: 'adv-diver',
    name: '어드밴스드',
    description: '다이빙 로그 20회를 기록했습니다.',
    icon: '🥈',
    condition: (logs) => logs.length >= 20
  },
  {
    id: 'veteran-diver',
    name: '마스터 다이버',
    description: '총 50회 이상의 다이빙을 기록했습니다.',
    icon: '🥇',
    condition: (logs) => logs.length >= 50
  },
  {
    id: 'century-diver',
    name: '100 로그 달성',
    description: '총 100회의 다이빙을 기록했습니다.',
    icon: '💯',
    condition: (logs) => logs.length >= 100
  },
  {
    id: 'deep-diver',
    name: '심해 탐험가',
    description: '30m 이상 깊이의 다이빙을 기록했습니다.',
    icon: '⚓',
    condition: (logs) => logs.some(l => l.maxDepthMeters >= 30)
  },
  {
    id: 'night-owl',
    name: '밤의 지배자',
    description: '나이트 다이빙을 3회 이상 기록했습니다.',
    icon: '🌙',
    condition: (logs) => logs.filter(l => l.diveType === DiveType.NIGHT).length >= 3
  },
  {
    id: 'marine-biologist',
    name: '해양 생물학자',
    description: '총 10종 이상의 해양 생물을 기록했습니다.',
    icon: '🐠',
    condition: (logs) => {
      const uniqueSpecies = new Set();
      logs.forEach(log => log.marineLifeSightings.forEach(life => uniqueSpecies.add(life.name)));
      return uniqueSpecies.size >= 10;
    }
  },
  {
    id: 'shutterbug',
    name: '수중 사진가',
    description: '사진이 포함된 로그를 5개 이상 작성했습니다.',
    icon: '📸',
    condition: (logs) => logs.filter(l => l.photos && l.photos.length > 0).length >= 5
  },
  {
    id: 'globe-trotter',
    name: '오션 익스플로러',
    description: '3곳 이상의 다른 지역에서 다이빙했습니다.',
    icon: '🌏',
    condition: (logs) => new Set(logs.map(l => l.location)).size >= 3
  },
  {
    id: 'cold-blooded',
    name: '아이스 다이버',
    description: '수온 15도 이하에서 다이빙했습니다.',
    icon: '❄️',
    condition: (logs) => logs.some(l => l.waterTempCelsius <= 15)
  },
  {
    id: 'tropical-diver',
    name: '트로피컬 다이버',
    description: '수온 28도 이상의 따뜻한 바다에서 5회 이상 다이빙했습니다.',
    icon: '🏝️',
    condition: (logs) => logs.filter(l => l.waterTempCelsius >= 28).length >= 5
  },
  {
    id: 'long-breath',
    name: '강철 폐활량',
    description: '한 번의 다이빙에서 60분 이상 체류했습니다.',
    icon: '😤',
    condition: (logs) => logs.some(l => l.durationMinutes >= 60)
  },
  {
    id: 'early-bird',
    name: '얼리 버드',
    description: '오전 8시 이전에 입수했습니다.',
    icon: '🌅',
    condition: (logs) => logs.some(l => {
      if (!l.timeIn) return false;
      const hour = parseInt(l.timeIn.split(':')[0]);
      return hour < 8;
    })
  },
  {
    id: 'safety-first',
    name: '안전 제일',
    description: '50bar 이상 남기고 출수한 로그가 10개 이상입니다.',
    icon: '🛡️',
    condition: (logs) => logs.filter(l => l.endPressureBar >= 50).length >= 10
  }
];

const logsCollection = (userId: string) => collection(db, 'users', userId, 'logs');
const customBadgesCollection = (userId: string) => collection(db, 'users', userId, 'customBadges');

const randomSuffix = () => Math.random().toString(36).slice(2, 10);

const uploadDataUrl = async (path: string, dataUrl: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataUrl, 'data_url');
  return getDownloadURL(storageRef);
};

const deleteStoragePath = async (path?: string) => {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    console.warn('Failed to delete storage object', error);
  }
};

const processLogPhotos = async (
  userId: string,
  logId: string,
  photos: string[] = [],
  existingPaths: string[] = []
) => {
  if (!photos.length) {
    await Promise.all(existingPaths.filter(Boolean).map(deleteStoragePath));
    return { photos: [], photoStoragePaths: [] };
  }

  const finalPhotos: string[] = [];
  const finalPaths: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (!photo) continue;

    if (photo.startsWith('data:')) {
      if (existingPaths[i]) {
        await deleteStoragePath(existingPaths[i]);
      }
      const path = `logs/${userId}/${logId}/${Date.now()}-${i}-${randomSuffix()}.png`;
      const url = await uploadDataUrl(path, photo);
      finalPhotos.push(url);
      finalPaths.push(path);
    } else {
      finalPhotos.push(photo);
      finalPaths.push(existingPaths[i] || '');
    }
  }

  if (existingPaths.length > finalPaths.length) {
    const stalePaths = existingPaths.slice(finalPaths.length).filter(Boolean);
    await Promise.all(stalePaths.map(deleteStoragePath));
  }

  return { photos: finalPhotos, photoStoragePaths: finalPaths };
};

export const getLogs = async (userId?: string): Promise<DiveLog[]> => {
  if (!userId) return [];
  const q = query(logsCollection(userId), orderBy('diveNumber', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DiveLog;
    return {
      ...data,
      photos: data.photos || [],
      photoStoragePaths: data.photoStoragePaths || [],
      marineLifeSightings: data.marineLifeSightings || [],
    };
  });
};

export const saveLog = async (log: DiveLog, userId?: string): Promise<void> => {
  if (!userId) throw new Error('User not authenticated');
  const logId = log.id || Date.now().toString();
  const existingDoc = await getDoc(doc(logsCollection(userId), logId));
  const existingData = existingDoc.exists() ? (existingDoc.data() as DiveLog) : undefined;

  const processedPhotos = await processLogPhotos(
    userId,
    logId,
    log.photos || [],
    existingData?.photoStoragePaths || log.photoStoragePaths || []
  );

  const payload: DiveLog = {
    ...log,
    id: logId,
    photos: processedPhotos.photos,
    photoStoragePaths: processedPhotos.photoStoragePaths,
  };

  await setDoc(doc(logsCollection(userId), logId), payload, { merge: true });
};

export const deleteLog = async (id: string, userId?: string): Promise<void> => {
  if (!userId) throw new Error('User not authenticated');
  const logRef = doc(logsCollection(userId), id);
  const snap = await getDoc(logRef);
  if (snap.exists()) {
    const data = snap.data() as DiveLog;
    if (data.photoStoragePaths) {
      await Promise.all(data.photoStoragePaths.filter(Boolean).map(deleteStoragePath));
    }
  }
  await deleteDoc(logRef);
};

export const getCustomBadges = async (userId?: string): Promise<Badge[]> => {
  if (!userId) return [];
  const snapshot = await getDocs(customBadgesCollection(userId));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Omit<Badge, 'condition'>;
    return {
      ...data,
      category: data.category ?? 'marine',
      condition: () => true,
    } as Badge;
  });
};

export const saveCustomBadge = async (
  badge: Omit<Badge, 'condition'>,
  userId?: string
): Promise<void> => {
  if (!userId) throw new Error('User not authenticated');
  const badgeId = badge.id || `custom-${Date.now()}`;
  let iconUrl = badge.icon;
  let storagePath = badge.storagePath;

  if (badge.icon.startsWith('data:')) {
    storagePath = `badges/${userId}/${badgeId}.png`;
    iconUrl = await uploadDataUrl(storagePath, badge.icon);
  }

  await setDoc(
    doc(customBadgesCollection(userId), badgeId),
    {
      ...badge,
      category: badge.category ?? 'marine',
      id: badgeId,
      icon: iconUrl,
      storagePath,
      unlockedAt: badge.unlockedAt || new Date().toISOString(),
    },
    { merge: true }
  );
};

export const deleteCustomBadge = async (badgeId: string, userId?: string): Promise<void> => {
  if (!userId) throw new Error('User not authenticated');
  const badgeRef = doc(customBadgesCollection(userId), badgeId);
  const snapshot = await getDoc(badgeRef);
  if (snapshot.exists()) {
    const data = snapshot.data() as Omit<Badge, 'condition'>;
    if (data.storagePath) {
      await deleteStoragePath(data.storagePath);
    }
  }
  await deleteDoc(badgeRef);
};

export const getUnlockedBadges = async (logs: DiveLog[], userId?: string): Promise<Badge[]> => {
  const standardBadges = AVAILABLE_BADGES.filter((badge) => badge.condition(logs)).map(
    (badge) => ({
      ...badge,
      unlockedAt: new Date().toISOString(),
    })
  );

  const customBadges = userId ? await getCustomBadges(userId) : [];

  return [...standardBadges, ...customBadges];
};