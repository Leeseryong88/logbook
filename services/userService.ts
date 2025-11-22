import { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  uploadString,
} from "firebase/storage";
import { db, storage } from "./firebase";
import { InstructorApplication, UserProfile } from "../types";

const usersCollection = collection(db, "users");
const displayNamesCollection = collection(db, "displayNames");

export const userDocRef = (uid: string) => doc(db, "users", uid);

const normalizeDisplayName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const displayNameDoc = (normalized: string) =>
  doc(displayNamesCollection, normalized);

export const reserveDisplayName = async (
  uid: string,
  displayName: string,
  options?: { validateOnly?: boolean; previousDisplayName?: string }
): Promise<boolean> => {
  const normalized = normalizeDisplayName(displayName);
  if (!normalized) {
    throw new Error("invalid_display_name");
  }

  const result = await runTransaction(db, async (tx) => {
    const ref = displayNameDoc(normalized);
    const snapshot = await tx.get(ref);
    const existingUid = snapshot.exists() ? snapshot.data()?.uid : null;

    if (existingUid && existingUid !== uid) {
      throw new Error("display_name_taken");
    }

    if (!options?.validateOnly) {
      tx.set(ref, {
        uid,
        displayName,
        normalized,
        updatedAt: Date.now(),
      });

      if (options?.previousDisplayName) {
        const previousNormalized = normalizeDisplayName(options.previousDisplayName);
        if (previousNormalized && previousNormalized !== normalized) {
          tx.delete(displayNameDoc(previousNormalized));
        }
      }
    }

    return true;
  });

  return result;
};

export const createUserProfileIfMissing = async (user: User) => {
  if (!user.uid) return;
  const docRef = userDocRef(user.uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      role: "diver",
      createdAt: new Date().toISOString(),
      instructorApplication: {
        status: "none",
      },
    };
    await setDoc(docRef, profile, { merge: true });
  }

  const effectiveName = user.displayName || snap.data()?.displayName || "";
  if (effectiveName) {
    try {
      await reserveDisplayName(user.uid, effectiveName);
    } catch (error) {
      console.warn("Failed to ensure display name reservation", error);
    }
  }
};

export const subscribeToUserProfile = (
  uid: string,
  callback: (profile: UserProfile) => void
) => {
  return onSnapshot(userDocRef(uid), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data() as UserProfile;
    callback({
      instructorApplication: {
        status: "none",
        ...data.instructorApplication,
      },
      ...data,
    });
  });
};

export const submitInstructorApplication = async (
  uid: string,
  file: File,
  notes: string
) => {
  const path = `certifications/${uid}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const certificateUrl = await getDownloadURL(storageRef);

  const application: InstructorApplication = {
    status: "pending",
    submittedAt: new Date().toISOString(),
    notes,
    certificateUrl,
    certificatePath: path,
  };

  await setDoc(
    userDocRef(uid),
    {
      instructorApplication: application,
    },
    { merge: true }
  );
};

export const fetchPendingInstructorApplications = async (): Promise<UserProfile[]> => {
  const q = query(
    usersCollection,
    where("instructorApplication.status", "==", "pending")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docSnap.data() as UserProfile);
};

export const isDisplayNameAvailable = async (displayName: string): Promise<boolean> => {
  const normalized = normalizeDisplayName(displayName);
  if (!normalized) return false;
  const snapshot = await getDoc(displayNameDoc(normalized));
  return !snapshot.exists();
};

export const approveInstructorApplication = async (
  targetUid: string,
  reviewerUid: string,
  reviewerName?: string
) => {
  const docRef = userDocRef(targetUid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const current = snap.data() as UserProfile;

  const updatedApplication: InstructorApplication = {
    status: "approved",
    submittedAt: current.instructorApplication?.submittedAt,
    notes: current.instructorApplication?.notes,
    certificateUrl: current.instructorApplication?.certificateUrl,
    certificatePath: current.instructorApplication?.certificatePath,
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerUid,
    reviewerName,
  };

  await updateDoc(docRef, {
    role: "instructor",
    instructorApplication: updatedApplication,
  });
};

export const updateProfilePhoto = async (
  uid: string,
  dataUrl: string
): Promise<void> => {
  if (!uid) throw new Error("로그인이 필요합니다.");
  if (!dataUrl?.startsWith("data:")) {
    throw new Error("invalid_image_data");
  }
  const mimeSegment = dataUrl.substring(5, dataUrl.indexOf(";")) || "image/jpeg";
  const extension = mimeSegment.split("/").pop() || "jpg";
  const path = `profile/${uid}/avatar-${Date.now()}.${extension}`;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataUrl, "data_url");
  const photoURL = await getDownloadURL(storageRef);

  let previousPath: string | undefined;
  try {
    const snapshot = await getDoc(userDocRef(uid));
    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      previousPath = data.photoPath;
    }
  } catch (error) {
    console.warn("Failed to fetch previous profile photo path", error);
  }

  await setDoc(
    userDocRef(uid),
    {
      photoURL,
      photoPath: path,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  if (previousPath && previousPath !== path) {
    try {
      await deleteObject(ref(storage, previousPath));
    } catch (error) {
      console.warn("Failed to delete previous profile photo", error);
    }
  }
};

export const updateProfileFields = async (
  uid: string,
  payload: { displayName?: string; bio?: string }
) => {
  const updates: Record<string, unknown> = {};
  if (typeof payload.displayName === "string") {
    updates.displayName = payload.displayName;
  }
  if (typeof payload.bio === "string") {
    updates.bio = payload.bio;
  }

  if (!Object.keys(updates).length) return;

  await setDoc(
    userDocRef(uid),
    {
      ...updates,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
};

