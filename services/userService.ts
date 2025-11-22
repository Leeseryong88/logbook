import { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "./firebase";
import { InstructorApplication, UserProfile } from "../types";

const usersCollection = collection(db, "users");

export const userDocRef = (uid: string) => doc(db, "users", uid);

export const createUserProfileIfMissing = async (user: User) => {
  if (!user.uid) return;
  const docRef = userDocRef(user.uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) return;

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
  const trimmed = displayName.trim();
  if (!trimmed) return false;
  const q = query(
    usersCollection,
    where("displayName", "==", trimmed),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return snapshot.empty;
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

