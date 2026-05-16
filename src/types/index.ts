export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  parentCode?: string;
  studentIds?: string[];
  photoUrl?: string;
  robotAvatar?: string;
  createdAt: any;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  photoUrl?: string;
  robotAvatar?: string;
  level: number;
  xp: number;
  points: number;
  attendancePercentage: number;
  ranking: number;
  badges: string[];
  grades: {
    robotics: number;
    programming: number;
    arduino: number;
    artificialIntelligence: number;
  };
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  status: 'present' | 'late' | 'absent';
  pointsAdded: number;
  timestamp: any;
  date: string; // YYYY-MM-DD
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  teacherId: string;
  type: 'excellent' | 'good' | 'bad';
  note?: string;
  pointsAdded: number;
  timestamp: any;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  targetRoles: UserRole[];
  createdAt: any;
}
