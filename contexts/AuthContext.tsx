import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { UserProfile, UserRole } from '../types';
import { createUserProfileIfMissing, reserveDisplayName, submitInstructorApplication, subscribeToUserProfile, updateProfileFields, isDisplayNameAvailable } from '../services/userService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  role: UserRole;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  applyForInstructor: (file: File, notes: string) => Promise<void>;
  updateAccountInfo: (payload: { displayName?: string; bio?: string }) => Promise<void>;
  checkDisplayName: (displayName: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const init = async () => {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      try {
        await createUserProfileIfMissing(user);
      } catch (e) {
        console.error('Failed to ensure user profile', e);
      }
      unsubscribeProfile = subscribeToUserProfile(user.uid, (profileData) => {
        setProfile(profileData);
        setProfileLoading(false);
      });
    };
    init();
    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [user]);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      try {
        await updateProfile(credential.user, { displayName });
        await reserveDisplayName(credential.user.uid, displayName);
      } catch (error) {
        // Ensure we don't leave a partially created account without nickname reservation
        await credential.user.delete();
        throw error;
      }
    }
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const applyForInstructor = async (file: File, notes: string) => {
    if (!user) throw new Error('로그인이 필요합니다.');
    await submitInstructorApplication(user.uid, file, notes);
  };

  const checkDisplayName = async (displayName: string) => {
    return isDisplayNameAvailable(displayName);
  };

  const updateAccountInfo = async (payload: { displayName?: string; bio?: string }) => {
    if (!user) throw new Error('로그인이 필요합니다.');

    await updateProfileFields(user.uid, payload);
    if (payload.displayName) {
      await updateProfile(user, { displayName: payload.displayName });
      await reserveDisplayName(user.uid, payload.displayName, { previousDisplayName: profile?.displayName });
    }
  };

  const role = profile?.role ?? 'diver';

  const value: AuthContextValue = {
    user,
    loading,
    profile,
    profileLoading,
    role,
    signInWithEmail,
    registerWithEmail,
    signInWithGoogle,
    resetPassword,
    logout,
    applyForInstructor,
    updateAccountInfo,
    checkDisplayName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

