export enum DiveType {
  FUN = 'Fun Dive',
  TRAINING = 'Training',
  NIGHT = 'Night Dive',
  DEEP = 'Deep Dive',
  WRECK = 'Wreck Dive',
  DRIFT = 'Drift Dive',
  PHOTOGRAPHY = 'Photography',
}

export type UserRole = 'admin' | 'diver' | 'instructor';

export type InstructorApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface InstructorApplication {
  status: InstructorApplicationStatus;
  submittedAt?: string;
  notes?: string;
  certificateUrl?: string;
  certificatePath?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
}

export enum WaterType {
  SALT = 'Salt',
  FRESH = 'Fresh',
}

export interface GeoLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface MarineLife {
  id: string;
  name: string;
  scientificName?: string;
  description?: string;
  imageUrl?: string;
}

export interface DiveLog {
  id: string;
  date: string;
  location: string;
  geo?: GeoLocation;
  siteName: string;
  diveNumber: number;
  timeIn: string;
  timeOut: string;
  durationMinutes: number;
  maxDepthMeters: number;
  avgDepthMeters?: number;
  startPressureBar: number;
  endPressureBar: number;
  visibilityMeters: number;
  waterTempCelsius: number;
  suitThicknessMm: number;
  weightsKg: number;
  diveType: DiveType;
  notes: string;
  buddies: string;
  marineLifeSightings: MarineLife[];
  photos: string[]; // URLs or base64 during edit
  photoStoragePaths?: string[];
  rating: number; // 1-5
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  storagePath?: string;
  unlockedAt?: string; // ISO Date string if unlocked
  category?: 'marine' | 'terrain';
  condition: (logs: DiveLog[]) => boolean;
}

export interface UserStats {
  totalDives: number;
  totalTimeMinutes: number;
  maxDepth: number;
  uniqueLocations: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  bio?: string;
  photoURL?: string;
  photoPath?: string;
  role: UserRole;
  createdAt?: string;
  instructorApplication?: InstructorApplication;
}