export type UserRole = 'STUDENT' | 'STAFF' | 'ADMIN';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  semester: string;
  section: string;
  phone: string;
  photoUrl?: string;
  enrolledCourses: Course[];
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  phone: string;
  assignedCourses: Course[];
}

export interface CourseSchedule {
  dayOrder: number;
  timeSlot: string;
  venue: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: string;
  staffId?: number;
  staffName?: string;
  schedules: CourseSchedule[];
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  date: string;
  status: AttendanceStatus;
  markedAt?: string;
  geoVerified: boolean;
  faceVerified: boolean;
  absentMinutes?: number;
}

export interface AttendanceSession {
  id: number;
  courseId: number;
  courseName: string;
  staffId: number;
  date: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  active: boolean;
  records: AttendanceRecord[];
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationAlert {
  studentId: number;
  studentName: string;
  message: string;
  timestamp: string;
  absentMinutes: number;
}

export interface BreakRecord {
  studentId: number;
  studentName: string;
  breakStarted: number; // Date.now()
  allowedMinutes: number;
  expired: boolean;
}

export const CAMPUS_LOCATIONS = [
  { label: 'C1 Block', lat: 10.9367, lng: 76.9560 },
  { label: 'C2 Block', lat: 10.9370, lng: 76.9563 },
  { label: 'Food Court', lat: 10.9362, lng: 76.9555 },
  { label: 'Library', lat: 10.9374, lng: 76.9558 },
  { label: 'Seminar Hall', lat: 10.9368, lng: 76.9570 },
  { label: 'Sports Ground', lat: 10.9355, lng: 76.9548 },
] as const;
